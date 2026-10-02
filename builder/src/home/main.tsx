/* Angela's Post Builder - the entry point for builder/index.html and for
 * `npm run build:single`, the one-file copy for a Claude artifact.
 *
 * It opens on her home page ("What would you like to make?") with the
 * bookmark reminder, and switches between the home page and the two guided
 * tools by state rather than by the address: an artifact frame does not route
 * on anything but a plain #anchor, and GitHub Pages has no server to send a
 * route to. The full listing editor is its own page, advanced/.
 */
import { StrictMode, useState } from "react";
// The shared chrome - palette, the webfont, the base type. The one-file build
// inlines it itself and ignores this.
import "../base.css";
import { createRoot } from "react-dom/client";
import AngelaHome from "./AngelaHome.tsx";
import type { Tool } from "./AngelaHome.tsx";
import ListingGuide from "../listing/ListingGuide.tsx";
import TitleBuilder from "../title/TitleBuilder.tsx";

function Angela() {
  const [tool, setTool] = useState<Tool | null>(null);
  const go = (next: Tool | null) => {
    setTool(next);
    window.scrollTo?.({ top: 0 });
  };
  if (tool === "listing") return <ListingGuide onHome={() => go(null)} />;
  if (tool === "title") return <TitleBuilder onHome={() => go(null)} />;
  return <AngelaHome onOpen={go} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Angela />
  </StrictMode>,
);
