/**
 * Stackra file contract:
 * Purpose: `SizeClass`, the three device shapes a screen falls into: a phone, a tablet (a POS counter tablet in
 *          portrait) or a desktop (a back-office browser, a tablet in landscape). `useBreakpoint` reports one.
 * Boundary: the values only; `breakpointStateOf` in core maps a width to one.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0302
 *          (decision 3); ADR 0305 (one declaration per file).
 */

/** The size classes, smallest first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the classes carry no labels.
export const SizeClass = Object.freeze(["phone", "tablet", "desktop"] as const);

/** One size class. */
export type SizeClass = (typeof SizeClass)[number];
