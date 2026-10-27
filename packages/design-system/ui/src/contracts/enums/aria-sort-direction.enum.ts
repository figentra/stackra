/**
 * Stackra file contract:
 * Purpose: `AriaSortDirection`, the two directions a column can be sorted in, spelt as React Aria and HTML's
 *          `aria-sort` spell them, so the web Table hands the value to React Aria unchanged.
 * Boundary: the values only; `nextSortDescriptor` says which direction a press on a column moves to. Not the wire
 *           code of a sort parameter: that is `@stackra/contracts`' `SortDirection` (`asc`, `desc`), and a list
 *           query maps between the two at its boundary (STA-1383: one name per concept).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313; WAI-ARIA 1.2 `aria-sort`; STA-1383 (unique public names).
 */

/** The ARIA sort directions. Verified against `react-aria-components` 1.22.1 (`SortDirection`). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the directions carry no labels.
export const AriaSortDirection = Object.freeze(["ascending", "descending"] as const);

/** One ARIA sort direction. */
export type AriaSortDirection = (typeof AriaSortDirection)[number];
