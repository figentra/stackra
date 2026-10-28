/**
 * Stackra file contract:
 * Purpose: `ForeignKeyColumn`, the chain `t.belongsTo(table, { column })` returns: a column plus its foreign key's
 *          delete rule and its index.
 * Boundary: a type only. The foreign key is `fk_<table>_<column>` and references a table of the same module's schema;
 *           a foreign key into another module is a link instead (`t.link`). Postgres never indexes a foreign key, so
 *           the column gets `idx_<table>_<column>` unless `withoutIndex()` defers it to a later online step.
 * Runtime: node
 * Governing contract: ADR 0231 (`fk_`, `idx_`); ADR 0294 (decision 28: links across modules); ADR 0159.
 */
import type { ColumnDefinition } from "#core/types/column-definition.type";

/** A foreign-key column of a blueprint. */
export interface ForeignKeyColumn extends ColumnDefinition {
  /** Deleting the referenced row deletes this one (`ON DELETE CASCADE`). */
  cascadeOnDelete: () => this;

  /** No index with the foreign key: a later migration builds it concurrently. */
  withoutIndex: () => this;
}
