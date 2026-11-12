/**
 * Stackra file contract:
 * Purpose: `ResourceListInput`, the wire input of a generated list read, as the panel's `tableInput` sends it: a page
 *          size and cursor, a sort (one key or up to three), filter values by key, and a search phrase.
 * Boundary: a type only. The read's closed schema is in the member's manifest (gen writes it per resource), and
 *           `ResourceListQuery` refuses a key its table does not declare.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: the closed table input); STA-1971.
 */
import type { SortDirection } from "@stackra/contracts";

/** One sort key and its direction. */
type Sort = { readonly key: string; readonly direction: SortDirection };

/** A list read's input. */
export interface ResourceListInput {
  /** The opaque cursor of the page to read; absent for the first page. */
  readonly cursor?: string;

  /** How many rows to return, 1 to 100; 20 when absent. */
  readonly limit?: number;

  /** The sort: one key or up to three. */
  readonly sort?: Sort | readonly Sort[];

  /** Filter values by key. */
  readonly filter?: Readonly<Record<string, unknown>>;

  /** The search phrase, for a table that searches. */
  readonly search?: string;
}
