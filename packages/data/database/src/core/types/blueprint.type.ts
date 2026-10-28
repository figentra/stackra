/**
 * Stackra file contract:
 * Purpose: `Blueprint`, what `schema.create(table, (t) => ...)` and `schema.table(table, (t) => ...)` hand a migration:
 *          the column types, the partner macros of the model traits and field types, the scope-tree columns, changes of
 *          existing columns, indexes, the primary key, column groups and generated row-level-security policies.
 * Boundary: a type only, and an interface so a package's macros merge into it: gen writes
 *           `declare module "@stackra/database" { interface Blueprint { dataClassification(column: string): ColumnGroup } }`
 *           from each `*.macro.ts`, and the compiler installs the macro under that name. Names are literals relative to
 *           the module's Postgres schema. Partner macros of traits other packages own (@stackra/tenancy's
 *           `belongsToTenant`, the search columns of @stackra/search) arrive the same way, never built in here. The
 *           scope-tree columns name no level: levels are deployment data (ADR 0327 d2).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros, literal snapshots); ADR 0239 (equality policy);
 *                     ADR 0327 (decisions 3, 8 and 9: `scope_id`, `scope_path`, isolation in the database);
 *                     `.agents/rules/tenancy.md`; ADR 0294 (decision 28: links); ADR 0135 (public ids); ADR 0231 (names).
 */
import type { ColumnChange } from "#core/types/column-change.type";
import type { ColumnDefinition } from "#core/types/column-definition.type";
import type { ColumnGroup } from "#core/types/column-group.type";
import type { ForeignKeyColumn } from "#core/types/foreign-key-column.type";
import type { RowLevelSecurityOptions } from "#core/types/row-level-security-options.type";
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
  string: (name: string, length?: number) => ColumnDefinition;

  /** A 32-bit `integer`. */
  integer: (name: string) => ColumnDefinition;

  /**
   * A 64-bit `bigint`, for a count or minor-unit amount past 2^31 (a ledger amount outside `money`). The ORM reads it
   * as a string unless the model field maps it to `bigint` or `number`.
   */
  bigint: (name: string) => ColumnDefinition;

  /**
   * An exact `numeric(precision, scale)`: `precision` digits in all (1 to 1000), `scale` of them after the point (0
   * to `precision`), for a measured reading or bound; never for money, which is `money`.
   */
  decimal: (name: string, precision: number, scale: number) => ColumnDefinition;

  /** Adds a `boolean` column. */
  boolean: (name: string) => ColumnDefinition;

  /** A `timestamptz`; every instant is stored with its zone. */
  timestamp: (name: string) => ColumnDefinition;

  /** Adds a `uuid` column. */
  uuid: (name: string) => ColumnDefinition;

  /** A `jsonb` document. */
  jsonb: (name: string) => ColumnDefinition;

  /** A `tsvector`, a full-text document for a GIN index; @stackra/search's `t.searchable(...)` macro writes them. */
  tsvector: (name: string) => ColumnDefinition;

  /** `text` limited to `values` by the check constraint `ck_<table>_<column>`. */
  enum: (name: string, values: readonly string[]) => ColumnDefinition;

  /** A `Money` field: `<name>_minor bigint` and `<name>_currency char(3)`. */
  money: (name: string) => ColumnGroup;

  /**
   * A `Link<T>` to another module's model: its public id (`varchar(33)`, or `uuid` with `publicIds: "uuid"`), indexed,
   * with no foreign key.
   */
  link: (column: string) => ColumnDefinition;

  /** A same-module relation: the key's type with the foreign key `fk_<table>_<column>` to `table.id`, indexed. */
  belongsTo: (table: string, options: { readonly column: string }) => ForeignKeyColumn;

  /** The `HasPublicId(prefix)` trait: the primary key `id` (`varchar(33)`, or `uuid` with `publicIds: "uuid"`). */
  hasPublicId: (prefix: string) => ColumnGroup;

  /** The `Timestamps` trait: `created_at` and `updated_at`, `timestamptz not null default now()`. */
  timestamps: () => ColumnGroup;

  /** The `UserStamps` trait: `created_by` and `updated_by`, principal public ids, nullable. */
  userStamps: () => ColumnGroup;

  /** The `Versioned` trait: `version integer not null default 1`. */
  versioned: () => ColumnGroup;

  /** The `SoftDeletes` trait: `deleted_at timestamptz`, nullable. */
  softDeletes: () => ColumnGroup;

  /** The `Archivable` trait: `archived_at timestamptz`, nullable. */
  archivable: () => ColumnGroup;

  /**
   * The `HasTree` trait: `parent_id varchar(33)` (the parent's public id, nullable, indexed for `children`) and
   * `tree_path ltree` (not null on a new table; nullable on an existing one until a backfill writes the paths) with the
   * GiST index `idx_<table>_tree_path` (`ancestors`, `descendants`, a subtree move), built online on an existing table.
   * The database needs `Extension.Ltree`.
   */
  tree: () => ColumnGroup;

  /**
   * The `HasMetadata` trait: `metadata jsonb not null default '{}'`. With `index: true`, the GIN index
   * `idx_<table>_metadata` that filtering on it needs, built online on an existing table.
   */
  metadata: (options?: { readonly index?: boolean }) => ColumnGroup;

  /**
   * The `AppendOnly` trait: revokes `UPDATE` on the table from `public` and the migrating role (the service's own,
   * which owns its tables), so no session of the service can change a row; inserts, reads and deletes (retention,
   * erasure) stay. On a created or an existing table; the inverse grants `UPDATE` back to the migrating role.
   */
  appendOnly: () => void;

  /**
   * The `Partitioned` trait: the new table is `partition by range (column)`, with a `<table>_default` partition that
   * catches rows no dated partition covers yet, the column added to the primary key (Postgres requires it), and a
   * BRIN index on it unless `brin: false`. A NOT NULL column of this blueprint; a unique index must include it.
   * `maintainPartitions` creates the dated partitions.
   */
  partitionBy: (column: string, options?: { readonly brin?: boolean }) => void;

  /** `Translated` fields: one `jsonb` locale map per field. */
  translatable: (fields: readonly string[]) => ColumnGroup;

  /**
   * Changes the existing column `column` (`schema.table` only): `t.change("lot_id").nullable()`,
   * `t.change("note").type("text", { from: "varchar(200)" })`. The change is written before the columns the blueprint
   * adds, each statement with its inverse; a column is changed once per blueprint and never in the blueprint that adds
   * it.
   */
  change: (column: string) => ColumnChange;

  /** An index over `columns`, named `idx_<table>_<columns>`. */
  index: (columns: readonly string[]) => TableIndex;

  /** A unique index over `columns`, named `idx_<table>_<columns>`. */
  unique: (columns: readonly string[]) => TableIndex;

  /** A composite primary key, such as a pivot's pair. */
  primary: (columns: readonly string[]) => void;

  /** The columns a macro wrote, so the caller sets their nullability and comment together. */
  group: (...columns: readonly ColumnDefinition[]) => ColumnGroup;

  /**
   * The scope node a row belongs to: `scope_id varchar(33)`, the node's `scp_` public id, indexed, with no foreign key
   * (the node is @stackra/scope's).
   */
  scopeId: () => ColumnDefinition;

  /**
   * The node's materialised path, denormalised: `scope_path ltree` with the GiST index `idx_<table>_scope_path`, built
   * online on an existing table. The database needs `Extension.Ltree`.
   */
  scopePath: () => ColumnDefinition;

  /**
   * Enables and forces row-level security with the generated policy `pol_<table>_<column>`, which reads
   * `options.setting` (set for the transaction, as `Database.withScope` sets the scope settings): `equals` compares the
   * column with it, `equalsOrUnset` also shows the null rows to a session with the setting unset (`is not distinct
   * from`), `ancestor` matches an `ltree` column at or below any of its `|`-separated paths through the GiST
   * index (`scope_path` with `app.scope_paths`), and `inherited` is `ancestor` plus a select-only policy
   * `pol_<table>_<column>_inherited` that shows the rows on the path above a granted path, read only (a template seeded
   * at the platform or product node, seen by every tenant below it; ADR 0412). Otherwise an unset or `''` setting matches no row.
   * The column must be defined in the same blueprint, and a blueprint takes one `rowLevelSecurity` call, as Postgres
   * ORs permissive policies. A business table keeps the equality policy @stackra/tenancy generates (ADR 0239, ADR 0327
   * d8).
   */
  rowLevelSecurity: (column: string, options: RowLevelSecurityOptions) => void;
}
