/* Driving the real tool in a real browser.
 *
 * WHY THIS EXISTS. The unit tests cover the pure logic - the boil, the palette
 * rules, the cover maths, the cutout mask, hydration - and they are worth
 * having. But every bug that actually shipped this far was one they structurally
 * could not catch:
 *
 *   - a selection box drawn in a colour that is invisible on the ground it sits
 *     on, which only a screenshot shows;
 *   - a rule whose own resize handles swallowed its entire body, so the most
 *     common shape in the tool could not be dragged at all;
 *   - uploads that silently drew nothing, because a lookup key and a display
 *     label had been conflated in a field that worked for folder images;
 *   - cmd-A sitting below the "nothing is selected" guard, so select-all could
 *     never run from an empty selection;
 *   - an undo tag keyed on the element rather than the gesture, so a group drag
 *     recorded dozens of steps.
 *
 * Not one of those is a wrong return value. They are all "the thing on the
 * screen does not do what it says", and the only way to catch them is to open
 * the thing and press it. So the checks that found them live here now, as
 * assertions rather than as scripts someone reads the output of.
 *
 * These tests are SLOW compared to the unit tests, by a lot, and that is fine:
 * they are a separate `npm run test:browser` rather than part of `npm test`, so
 * the fast suite stays fast and this one runs when the editor is touched.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { readdirSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright";

const PORT = 5199;
export const BASE = `http://localhost:${PORT}/`;

let server: ChildProcess | null = null;
let browser: Browser | null = null;

/* Playwright resolves its own browser download, which is right on a machine
 * where `npx playwright install chromium` has been run. Where the browsers live
 * somewhere else and do not match the revision this Playwright wants - a
 * pre-baked image, a shared cache - the default launch throws, so fall back to
 * whatever chromium IS on disk rather than failing the suite over a path. */
async function launch(): Promise<Browser> {
  try {
    return await chromium.launch();
  } catch (err) {
    const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (!root) throw err;
    const dir = readdirSync(root).find((d) => d.startsWith("chromium-"));
    if (!dir) throw err;
    return chromium.launch({ executablePath: `${root}/${dir}/chrome-linux/chrome` });
  }
}

async function reachable(): Promise<boolean> {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(500) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Start the dev server and the browser. Called once, by the first spec to need them. */
export async function start(): Promise<void> {
  if (browser) return;
  if (!(await reachable())) {
    server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
      stdio: "ignore",
      detached: false,
    });
    const until = Date.now() + 30_000;
    while (Date.now() < until) {
      if (await reachable()) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!(await reachable())) throw new Error(`the dev server never came up on ${BASE}`);
  }
  browser = await launch();
}

export async function stop(): Promise<void> {
  await browser?.close();
  browser = null;
  server?.kill();
  server = null;
}

/* A bare page on the same dev server. Each spec drives its own tool from here. */
export async function newPage(opts: { phone?: boolean } = {}): Promise<Page> {
  await start();
  /* `phone` is not cosmetic: it makes `(pointer: coarse)` match, which is the
   * switch the export path reads to decide between an anchor download and the
   * press-and-hold fallback. A narrow viewport alone leaves the pointer fine
   * and tests the wrong branch. */
  if (opts.phone) {
    return browser!.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 3,
    });
  }
  return browser!.newPage({ viewport: { width: 1440, height: 1000 } });
}

/* Open one of Angela's two tools from her home page, the only way in: there is
 * no router, so the cards switch tools in place. Storage is cleared first so a
 * draft from an earlier run cannot skip a step, and the bookmark reminder is
 * marked done so it does not sit over the cards. */
export async function openFromHome(page: Page, card: "A listing post" | "A reel title"): Promise<void> {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("angela-home-bookmarked", "yes");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(card) }).click();
}
