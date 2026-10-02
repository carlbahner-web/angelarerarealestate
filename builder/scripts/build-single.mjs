/* Build Angela's Post Builder as ONE self-contained HTML file.
 *
 * Same idea as wild-ride's games/src/build.py: base64 every asset into the page
 * so it runs from anywhere with no server, no public/ directory and no network.
 * Used for a Claude artifact, or a file you can open on a phone - `npm run
 * build` is still the normal multi-file one. It is her home page and the two
 * guided tools, switched by state; the full editor (advanced/) is not in it.
 *
 * Output is deliberately FRAGMENT-shaped: a <title>, a <style>, the mount point
 * and one <script>, with no <!doctype>/<html>/<head>/<body>. That is the format
 * the artifact host wraps, and a browser opens it happily too.
 *
 * Usage: npm run build:single [-- outfile]
 */
import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import layers from "../src/listing/layers.json" with { type: "json" };
import photos from "../src/listing/photos.json" with { type: "json" };

const ROOT = path.resolve(import.meta.dirname, "..");

const OUT = process.argv[2] ?? path.join(ROOT, "dist-single", "angela.html");

const MIME = {
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

/* Everything the running app asks for by path, as data URIs. The listing
 * template's keyed layers are taken from the manifest rather than listed by
 * hand, so adding artwork to assets/listing-src/ and re-running `npm run art`
 * cannot leave this build silently one layer short. The reel titles' peony
 * paper is cut from the listing frame, so this covers both tools. */
const ASSETS = [
  "/fonts/TAYWingman.woff2",
  ...Object.keys(layers).map((name) => `/listing/${name}.png`),
  // Each arch's alpha, which a photographed headshot is clipped by. Written
  // beside its layer by chroma-key.mjs and recorded in the same manifest, so a
  // second layout cannot arrive with a mask this build does not know about.
  ...Object.values(layers).map((l) => l.mask).filter(Boolean),
  // The photographs and the mattes that key their backdrop out. Neither is a
  // keyed layer, so neither is in layers.json. De-duplicated the same way
  // template.ts does it: two crops of one photograph share a file and a matte,
  // and inlining a megabyte of JPEG twice would show up in the download.
  ...new Set(photos.shots.flatMap((s) => [s.file, s.matte].filter(Boolean))),
];

async function dataUri(publicPath) {
  const file = path.join(ROOT, "public", publicPath.replace(/^\//, ""));
  const buf = await readFile(file);
  const mime = MIME[path.extname(file)] ?? "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const inline = {};
for (const p of ASSETS) inline[p] = await dataUri(p);

/* The artifact viewer wraps this fragment in its own skeleton, which pads the
 * root element by the phone's safe-area insets so a page can run edge to edge.
 * A child sized in vh ignores that padding and overflows by exactly the inset -
 * enough to put a scrollbar on a page that fits. So the one-screen measurements
 * are restated against the element rather than the viewport. */
const ARTIFACT_SHIM = `
html, body { height: 100%; }
.listing, .title { min-height: 100%; }
.listing-panel { max-height: 100dvh; }
.listing-canvas { max-height: calc(100dvh - 140px); }
@media (max-width: 900px) {
  .listing-panel { max-height: none; }
  .listing-canvas { max-height: none; }
}
`;

// The panel's own webfont is referenced from CSS, so swap that URL too.
let css = [
  await readFile(path.join(ROOT, "src/base.css"), "utf8"),
  await readFile(path.join(ROOT, "src/listing/listing.css"), "utf8"),
  await readFile(path.join(ROOT, "src/title/title.css"), "utf8"),
  await readFile(path.join(ROOT, "src/home/home.css"), "utf8"),
  await readFile(path.join(ROOT, "src/listing/guide.css"), "utf8"),
  ARTIFACT_SHIM,
].join("\n");
css = css.replace(/url\("(\/fonts\/[^"]+)"\)/g, (_, p) => `url("${inline[p]}")`);

/* esbuild rather than Vite: one IIFE, no module graph, no import.meta - which
 * this app deliberately does not use, so nothing has to be stubbed. */
const bundled = await build({
  entryPoints: [
    path.join(ROOT, "src/home/main.tsx"),
  ],
  bundle: true,
  format: "iife",
  minify: true,
  jsx: "automatic",
  target: ["es2022"],
  write: false,
  loader: { ".css": "empty", ".json": "json" }, // the CSS is inlined above, not imported
  // One file means one script: nothing may be emitted as a separate chunk.
  splitting: false,
  define: {
    "process.env.NODE_ENV": '"production"',
    // There is no import.meta in an IIFE, and assets.ts reads the deploy base
    // from it. Nothing in this build fetches by path anyway - every asset is a
    // data URI on window.__SL_INLINE - so the base is "/" and unused. Both
    // spellings, because the guard there tests the object before reading it.
    "import.meta.env": '{"BASE_URL":"/"}',
    "import.meta.env.BASE_URL": '"/"',
  },
});
const js = bundled.outputFiles[0].text;

const html = `<title>Angela's Post Builder</title>
<style>
${css}
</style>
<div id="root"></div>
<script>window.__SL_INLINE = ${JSON.stringify(inline)};</script>
<script>${js}</script>
`;

// dist-single/ is gitignored, so it is missing on a fresh clone and writeFile
// will not create it.
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, html);
const kb = (s) => `${Math.round(s / 1024)}KB`;
console.log(`wrote ${OUT}`);
console.log(`  css ${kb(css.length)} · js ${kb(js.length)} · assets ${kb(JSON.stringify(inline).length)}`);
console.log(`  total ${kb(html.length)}`);
