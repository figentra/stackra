/**
 * Stackra file contract:
 * Purpose: `ResourceListOptions`, what gen hands `ResourceListQuery` for a resource whose `list` operation is `true`:
 *          the query key and the resource table's closed input (its sortable keys, its filter keys, whether it searches)
 *          and the row's field names.
 * Boundary: a type only; static data gen writes from the recorded resource tree (ADR 0307 rule 2).
 * Runtime: node
 * Governing contract: ADR 0307 (rules 1 and 2); STA-1971.
 */

/** The options of one generated list read. */
export interface ResourceListOptions {
  /** The query key, `<model>.list`. */
  readonly key: string;

  /** The keys the table sorts by. */
  readonly sortable: readonly string[];

  /** The keys the table filters by. */
  readonly filters: readonly string[];

  /** Whether the table searches (the model is `@Searchable`). */
  readonly searchable?: boolean;

  /** The row's field names, picked from each record; absent when the row is the model. */
  readonly fields?: readonly string[];
}
