/* The full listing editor - every control on one screen - for the entry at
 * advanced/index.html. Not linked from her home page: the guided version is
 * the one she uses, and this one is for when a post needs something it does
 * not ask about. Its Home link goes back up to her page.
 */
import { StrictMode } from "react";
import "../base.css";
import { createRoot } from "react-dom/client";
import ListingBuilder from "./ListingBuilder.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ListingBuilder />
  </StrictMode>,
);
