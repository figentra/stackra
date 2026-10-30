/**
 * Stackra file contract:
 * Purpose: the rows an `ExportDialog` can export: the `selection` the user ticked, the rows `filtered` by the current
 *          search and filters, or `all` of them.
 * Boundary: the values only; the dialog offers a scope only when the app passes its count.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16 (owner decision 2026-10-28, P1 + P2 core).
 */

/** The export scopes, narrowest first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the scopes carry no labels.
export const ExportScope = Object.freeze(["selection", "filtered", "all"] as const);

/** One export scope. */
export type ExportScope = (typeof ExportScope)[number];
