/**
 * Stackra file contract:
 * Purpose: `TableQuery`, the closed table input `CrudService.table` applies: the cursor, the page size, the sort (one
 *          key or several) and the filter values gen compiled from a resource table (`TableInput`, or a list query's
 *          own input).
 * Boundary: a type only, structural so every generated list input fits. The sort keys and filter keys are model paths
 *           from a closed enum and object, so no raw field name reaches SQL; each filter value is a `TableFilter`,
 *           checked at run time, since a generated input types it as `unknown`.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: the table is a server contract); ADR 0095 (shapes); reporting gap 5.
 */
import type { TableSort } from "#core/types/table-sort.type";

/** A table read. */
export interface TableQuery {
  /** The opaque cursor of the page to read; absent for the first page. */
  readonly cursor?: string;

  /** How many rows to return. */
  readonly limit: number;

  /**
   * The sort: one key, or up to three keys in order (a multi-key sort); absent sorts by the primary key, newest first.
   * The primary key always ends the order, so ties page stably.
   */
  readonly sort?: TableSort | readonly TableSort[];

  /** Filter values by model path, each a `TableFilter`: a value matches equal, a list any item, an object its operator. */
  readonly filter?: Readonly<Record<string, unknown>>;
}
