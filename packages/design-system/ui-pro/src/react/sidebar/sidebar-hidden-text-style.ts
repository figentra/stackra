/**
 * Stackra file contract:
 * Purpose: the inline style that hides text from the eye and keeps it for assistive technology, for the names
 *          `Sidebar.Mobile` and `Sidebar.MenuIcon` add where HeroUI Pro gives its element none.
 * Boundary: a style object only; it is inline so it needs no Tailwind scan of this package.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); STA-403 FR-005.
 */
import type { CSSProperties } from "react";

/** The standard visually-hidden recipe: one clipped pixel, out of the flow, still read by a screen reader. */
export const HIDDEN_TEXT_STYLE: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};
