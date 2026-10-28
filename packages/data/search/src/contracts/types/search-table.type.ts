/**
 * Stackra file contract:
 * Purpose: `SearchTable`, the index a driver call addresses: the model's table, its Postgres schema and the column of
 *          its primary key.
 * Boundary: a type only, read by `Search` from the model's ORM metadata. The Postgres driver writes and reads the
 *           search columns of that table; the memory driver keys its documents by schema and table.
 * Runtime: isomorphic
 * Governing contract: stackra-303 (versions); ADR 0221 (decision 1: the index lives with the data); ADR 0294 (decision 20: a schema per
 *                     module).
 */

/** One model's index. */
export interface SearchTable {
  /** The module's Postgres schema; absent for the connection's current schema. */
  readonly schema?: string;

  /** The table name, snake_case. */
  readonly table: string;

  /** The primary key column. */
  readonly primaryKey: string;

  /**
   * The index version addressed (ADR 0221 d7): absent for the live index, which every read uses and every write keeps
   * current; a version from 2 for the shadow a versioned rebuild writes into before its swap.
   */
  readonly version?: number;
}
