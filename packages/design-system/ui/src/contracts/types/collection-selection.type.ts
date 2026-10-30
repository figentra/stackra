/**
 * Stackra file contract:
 * Purpose: `CollectionSelection`, what a bulk action acts on: the ids of the rows chosen, or, when "Select all N" was
 *          chosen in server mode, a descriptor of every row matching the search and filter but the ids unticked since
 *          (`except`); the server resolves it.
 * Boundary: types only; plain data, so it serialises into a request body as is. Client mode always answers with ids.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (select all across pages); STA-1371.
 */
import type { CollectionFilter } from "#contracts/types/collection-filter.type";

/** The rows a bulk action acts on. */
export type CollectionSelection =
  | {
      /** The rows chosen, by id. */
      readonly kind: "ids";
      readonly ids: readonly string[];
    }
  | {
      /** Every row matching `search` and `filter`, across all pages; the server resolves which they are. */
      readonly kind: "all-matching";
      readonly search: string;
      readonly filter: CollectionFilter;
      /** How many rows matched when the user chose them. */
      readonly totalCount: number;
      /** The rows the user unticked after choosing them all: every match but these. */
      readonly except: readonly string[];
    };
