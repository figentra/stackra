/**
 * Stackra file contract:
 * Purpose: `SchemaSnapshot`, a database schema as flat rows (columns with type and nullability, indexes, foreign keys),
 *          the one shape `stackra db diff` compares: gen builds the expected one from the models and
 *          `@stackra/database/node`'s `readMigratedSchema` returns the actual one.
 * Boundary: a type only, structural so the pure entry needs no `@stackra/database` import (the `MigrationUnit`
 *           precedent). An expected column whose field type has no Postgres mapping has no `type`; the comparison
 *           reports it as `type_unmapped` instead of guessing. An actual type is Postgres's `format_type` text.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (migrations); ADR 0282 (decision 3: `stackra db diff`); STA-1808.
 */
/** A schema as flat rows. */
export interface SchemaSnapshot {
  /** Every column. */
  readonly columns: readonly {
    readonly schema: string;
    readonly table: string;
    readonly name: string;
    readonly type?: string;
    readonly nullable: boolean;
  }[];

  /** Every index but a primary key. */
  readonly indexes: readonly {
    readonly schema: string;
    readonly table: string;
    readonly name: string;
    readonly columns: readonly string[];
    readonly unique: boolean;
    readonly method?: string;
    readonly predicate?: string | undefined;
  }[];

  /** Every foreign key. */
  readonly foreignKeys: readonly {
    readonly schema: string;
    readonly table: string;
    readonly name: string;
    readonly columns: readonly string[];
    readonly referencedSchema: string;
    readonly referencedTable: string;
  }[];
}
