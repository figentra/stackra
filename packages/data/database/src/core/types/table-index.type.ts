/**
 * Stackra file contract:
 * Purpose: `TableIndex`, the chain `t.index(columns)` and `t.unique(columns)` return: online build, access method and
 *          partial predicate.
 * Boundary: a type only. The name is `idx_<table>_<columns>`; a unique rule is a unique index, never an `ADD UNIQUE`
 *           constraint. On a table this migration creates the index builds in the transaction; on an existing table
 *           `concurrently()` is required and the index compiles to its own non-transactional step.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: concurrent index builds in their own step); ADR 0231 (`idx_`).
 */
import type { IndexMethod } from "#core/types/index-method.type";

/** One index of a blueprint. */
export interface TableIndex {
  /** Built with `CREATE INDEX CONCURRENTLY`, so writes continue; required on a table that already exists. */
  concurrently: () => this;

  /** The access method (`gin` for a tsvector or jsonb, `gist` for ranges and ltree). */
  using: (method: IndexMethod) => this;

  /** A partial index: only rows matching the SQL predicate (`deleted_at is null`). */
  where: (predicate: string) => this;
}
