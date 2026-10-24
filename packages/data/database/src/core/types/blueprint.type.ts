/**
 * Stackra file contract:
 * Purpose: `Blueprint`, what `schema.create(table, (t) => ...)` and `schema.table(table, (t) => ...)` hand a migration:
 *          the column types, the partner macros of the model traits and field types, indexes, the primary key, column
 *          groups and the row-level-security policy of a scope level.
 * Boundary: a type only, and an interface so a package's macros merge into it: gen writes
 *           `declare module "@stackra/database" { interface Blueprint { dataClassification(column: string): ColumnGroup } }`
 *           from each `*.macro.ts`, and the compiler installs the macro under that name. Names are literals relative to
 *           the module's Postgres schema. Partner macros of traits other packages own (the scope column of
 *           @stackra/tenancy, the search columns of @stackra/search) arrive the same way, never built in here.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros, literal snapshots); ADR 0239 (equality policy);
 *                     ADR 0294 (decision 28: links); ADR 0135 (public ids); ADR 0231 (names).
 */
import type { ColumnDefinition } from "#core/types/column-definition.type";
import type { ColumnGroup } from "#core/types/column-group.type";
import type { ForeignKeyColumn } from "#core/types/foreign-key-column.type";
import type { TableIndex } from "#core/types/table-index.type";

/**
 * The table being defined or changed.
 *
 * @example
 * schema.create("order_lines", (t: Blueprint) => {
 *   t.hasPublicId("oln");
 *   t.belongsTo("orders", { column: "order_id" }).notNull().cascadeOnDelete().comment("The owning order.");
 *   t.link("variant_id").notNull().comment("The catalogue variant sold.");
 *   t.integer("quantity").notNull().comment("Units ordered; at least one.");
 *   t.money("unit_price").notNull().comment("Price of one unit at placement.");
 * });
 */
export interface Blueprint {
  /** `varchar(length)`, or `text` without a length (an unbounded string). */
  string(name: string, length?: number): ColumnDefinition;

  /** A 32-bit `integer`. */
  integer(name: string): ColumnDefinition;

  /** A `boolean`. */
  boolean(name: string): ColumnDefinition;

  /** A `timestamptz`; every instant is stored with its zone. */
  timestamp(name: string): ColumnDefinition;

  /** A `uuid`. */
  uuid(name: string): ColumnDefinition;

  /** A `jsonb` document. */
  jsonb(name: string): ColumnDefinition;

  /** `text` limited to `values` by the check constraint `ck_<table>_<column>`. */
  enum(name: string, values: readonly string[]): ColumnDefinition;

  /** A `Money` field: `<name>_minor bigint` and `<name>_currency char(3)`. */
  money(name: string): ColumnGroup;

  /** A `Link<T>` to another module's model: its public id in `varchar(33)`, indexed, with no foreign key. */
  link(column: string): ColumnDefinition;

  /** A same-module relation: `varchar(33)` with the foreign key `fk_<table>_<column>` to `table.id`, indexed. */
  belongsTo(table: string, options: { readonly column: string }): ForeignKeyColumn;

  /** The `HasPublicId(prefix)` trait: the primary key `id varchar(33)`. */
  hasPublicId(prefix: string): ColumnGroup;

  /** The `Timestamps` trait: `created_at` and `updated_at`, `timestamptz not null default now()`. */
  timestamps(): ColumnGroup;

  /** The `UserStamps` trait: `created_by` and `updated_by`, principal public ids, nullable. */
  userStamps(): ColumnGroup;

  /** The `Versioned` trait: `version integer not null default 1`. */
  versioned(): ColumnGroup;

  /** The `SoftDeletes` trait: `deleted_at timestamptz`, nullable. */
  softDeletes(): ColumnGroup;

  /** `Translated` fields: one `jsonb` locale map per field. */
  translatable(fields: readonly string[]): ColumnGroup;

  /** An index over `columns`, named `idx_<table>_<columns>`. */
  index(columns: readonly string[]): TableIndex;

  /** A unique index over `columns`, named `idx_<table>_<columns>`. */
  unique(columns: readonly string[]): TableIndex;

  /** A composite primary key, such as a pivot's pair. */
  primary(columns: readonly string[]): void;

  /** The columns a macro wrote, so the caller sets their nullability and comment together. */
  group(...columns: readonly ColumnDefinition[]): ColumnGroup;

  /**
   * Enables and forces row-level security with one equality policy on `<level>_id`, read from the setting
   * `Database.withScope` sets for the transaction. The column must be defined in the same blueprint.
   */
  rowLevelSecurity(level: string): void;
}
