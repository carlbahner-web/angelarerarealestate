import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Two pages: index.html is Angela's Post Builder - her home page and the two
// guided tools - and advanced/index.html is the full listing editor.
//
// BASE_PATH is where the builder lives on the live site. GitHub Pages serves
// this repo from a subdirectory (/angelarerarealestate/) and the builder sits
// under /builder/ inside it, and every built URL - the JS, the CSS, the fonts
// and artwork in public/ - has to carry that prefix or the page loads and then
// quietly fetches nothing. Dev, `npm run build` and the single-file build
// leave it unset and get "/"; only the Pages workflow sets it.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        advanced: resolve(import.meta.dirname, "advanced/index.html"),
      },
    },
  },
});
