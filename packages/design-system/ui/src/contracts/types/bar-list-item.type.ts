/**
 * Stackra file contract:
 * Purpose: `BarListItem`, one row of a BarList: its key, label and value, and an optional link.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */

/** One ranked row. */
export interface BarListItem {
  /** Unique within the list. */
  readonly key: string;
  /** The row's name, for example a city or a page. */
  readonly label: string;
  /** The row's figure; its bar is this share of the largest. */
  readonly value: number;
  /** Where the row's name links to, on web. */
  readonly href?: string | undefined;
}
