/**
 * Stackra file contract:
 * Purpose: `ShortcutOverlayContext`, the id of the nearest `ShortcutOverlayScope`, or `null` on the page.
 * Boundary: internal to `./react`.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import { createContext } from "react";

/** The nearest overlay scope's id. */
export const ShortcutOverlayContext = createContext<number | null>(null);
