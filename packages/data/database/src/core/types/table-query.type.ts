/**
 * Stackra file contract:
 * Purpose: `TableQuery`, the closed table input `CrudService.table` applies: the cursor, the page size, the sort and
 *          the filter values gen compiled from a resource table (`TableInput`, or a list query's own input).
 * Boundary: a type only, structural so every generated list input fits. The sort key and filter keys are model paths
 *           from a closed enum and object, so no raw field name reaches SQL.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: the table is a server contract); ADR 0095 (shapes).
 */
import type { SortDirection } from "@stackra/contracts";

/** A table read. */
export interface TableQuery {
  /** The opaque cursor of the page to read; absent for the first page. */
  readonly cursor?: string;

  /** How many rows to return. */
  readonly limit: number;

  /** The sort key (a dotted model path) and direction; absent sorts by the primary key, newest first. */
  readonly sort?: { readonly key: string; readonly direction: SortDirection };

  /** Filter values by model path: a value matches equal, an array matches any of its items. */
  readonly filter?: Readonly<Record<string, unknown>>;
}
