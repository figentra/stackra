/**
 * Stackra file contract:
 * Purpose: `MigratedSchema`, the schema a member's compiled migrations build, read back from a throwaway Postgres: its
 *          columns (type and nullability), its indexes (columns, uniqueness, method, predicate) and its foreign keys,
 *          each row keyed by Postgres schema and table.
 * Boundary: a type only, the result of `readMigratedSchema`. Plain data, so `@stackra/gen` compares it with the models
 *           through its own structural copy and never imports this package. Primary keys are not listed as indexes;
 *           partitions of a partitioned table are not listed as tables.
 * Runtime: node
 * Governing contract: ADR 0159 (migrations); ADR 0282 (decision 3: `stackra db diff`); STA-1808.
 */
/** The migrated schema as flat rows. */
export interface MigratedSchema {
  /** Every column: `type` is Postgres's own `format_type` (`character varying(33)`, `timestamp with time zone`). */
  readonly columns: readonly {
    readonly schema: string;
    readonly table: string;
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
  }[];

  /** Every index but a primary key, with its columns in order. */
  readonly indexes: readonly {
    readonly schema: string;
    readonly table: string;
    readonly name: string;
    readonly columns: readonly string[];
    readonly unique: boolean;
    readonly method: string;
    readonly predicate: string | undefined;
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
