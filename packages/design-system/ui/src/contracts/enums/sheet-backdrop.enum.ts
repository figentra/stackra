/**
 * Stackra file contract:
 * Purpose: the looks of the backdrop behind a sheet: `opaque` (the dim scrim, the default), `blur` (the page blurred)
 *          and `transparent` (no scrim; the page stays visible but still blocked).
 * Boundary: the values only; each runtime's `Sheet` maps them to its own backdrop. Only the bottom sheet of a stack
 *           dims the page.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); owner approval 2026-10-31 (HeroUI 3.2.7 and Sheet, STA-1371).
 */

/** The sheet backdrop looks. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the looks carry no labels.
export const SheetBackdrop = Object.freeze(["opaque", "blur", "transparent"] as const);

/** One sheet backdrop look. */
export type SheetBackdrop = (typeof SheetBackdrop)[number];
