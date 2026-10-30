/**
 * Stackra file contract:
 * Purpose: `BarListContractProps`, the props every runtime's `BarList` takes: a ranked list of labels with a value
 *          each, every row's bar sized against the largest (or `max`).
 * Boundary: types only; values are written in the customer's digits and `valueFormat`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { BarListItem } from "#contracts/types/bar-list-item.type";

/** Props shared by the web and native `BarList`. */
export interface BarListContractProps {
  /** The rows. */
  readonly items: readonly BarListItem[];
  /** The list's name, for example "Sales by city". */
  readonly label: string;
  /** How values are written, for example a currency. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The value of a full bar; defaults to the largest value. */
  readonly max?: number | undefined;
  /** `descending` (the default) ranks the rows by value; `none` keeps the order given. */
  readonly sort?: "descending" | "none" | undefined;
}
