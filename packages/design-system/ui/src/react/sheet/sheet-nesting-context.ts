/**
 * Stackra file contract:
 * Purpose: `SheetNestingContext`, true inside a web Sheet's content, so a Sheet rendered there opens as HeroUI's
 *          nested sheet (stacked over it, the one under scales back) instead of a second root.
 * Boundary: internal to `react/sheet`.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); STA-1371.
 */
import { createContext } from "react";

/** True inside a Sheet. */
export const SheetNestingContext = createContext(false);
