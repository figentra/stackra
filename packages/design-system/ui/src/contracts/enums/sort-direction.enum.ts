/**
 * Stackra file contract:
 * Purpose: the two directions a column can be sorted in, spelt as React Aria and HTML's `aria-sort` spell them, so the
 *          web Table hands the value to React Aria unchanged and a server-driven sort sends it as it is.
 * Boundary: the values only; `nextSortDescriptor` says which direction a press on a column moves to.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313; WAI-ARIA 1.2 `aria-sort`.
 */

/** The sort directions. Verified against `react-aria-components` 1.22.1 (`SortDirection`). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the directions carry no labels.
export const SortDirection = Object.freeze(["ascending", "descending"] as const);

/** One sort direction. */
export type SortDirection = (typeof SortDirection)[number];
