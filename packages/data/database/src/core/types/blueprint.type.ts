/**
 * Stackra file contract:
 * Purpose: `Blueprint`, what `schema.create(table, (t) => ...)` and `schema.table(table, (t) => ...)` hand a migration:
 *          the column types, the partner macros of the model traits and field types, the scope-tree columns, changes of
 *          existing columns, indexes, the primary key, column groups, check and exclusion constraints, generated
 *          row-level-security policies, and the expand and contract steps of a drop or rename (STA-1406).
 * Boundary: a type only, and an interface so a package's macros merge into it: gen writes
 *           `declare module "@stackra/database" { interface Blueprint { dataClassification(column: string): ColumnGroup } }`
 *           from each `*.macro.ts`, and the compiler installs the macro under that name. Names are literals relative to
 *           the module's Postgres schema. Partner macros of traits other packages own (@stackra/tenancy's
 *           `belongsToTenant`, the search columns of @stackra/search) arrive the same way, never built in here. The
 *           scope-tree columns name no level: levels are deployment data (ADR 0327 d2).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros, literal snapshots; decision 3: expand and contract);
 *                     ADR 0160 note of 2026-11-03 (btree_gist exclusions); ADR 0239 (equality policy);
 *                     ADR 0327 (decisions 3, 8 and 9: `scope_id`, `scope_path`, isolation in the database);
 *                     ADR 0239 (2026-11-07 amendment, gap A: `systemAccess`);
 *                     `.agents/rules/tenancy.md`; ADR 0294 (decision 28: links); ADR 0135 (public ids); ADR 0231 (names).
 */
import type { ColumnChange } from "#core/types/column-change.type";
import type { ColumnDefinition } from "#core/types/column-definition.type";
import type { ColumnGroup } from "#core/types/column-group.type";
import type { ContractOptions } from "#core/types/contract-options.type";
import type { DroppedIndexOptions } from "#core/types/dropped-index-options.type";
import type { ExclusionOptions } from "#core/types/exclusion-options.type";
import type { ForeignKeyColumn } from "#core/types/foreign-key-column.type";
import type { RenamedColumnOptions } from "#core/types/renamed-column-options.type";
import type { RowLevelSecurityOptions } from "#core/types/row-level-security-options.type";
import type { SystemAccessOptions } from "#core/types/system-access-options.type";
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

  /**
   * A `tstzrange`, a span of instants (a booking's `during`, a price's validity), which an exclusion constraint compares
   * with `&&` (`t.exclude`).
   */
  timeRange: (name: string) => ColumnDefinition;

  /** A `tsvector`, a full-text document for a GIN index; @stackra/search's `t.searchable(...)` macro writes them. */
  tsvector: (name: string) => ColumnDefinition;

  /**
   * A `GeoPoint` field: `geography(Point,4326)` (WGS 84) with the GiST index `idx_<table>_<column>`, built online on an
   * existing table (ADR 0314). The database needs `Extension.Postgis`.
   */
  point: (name: string) => ColumnDefinition;

  /** A `GeoPolygon` field: `geography(Polygon,4326)` with its GiST index, as `point` (ADR 0314). */
  polygon: (name: string) => ColumnDefinition;

  /** A `GeoLine` field: `geography(LineString,4326)` with its GiST index, as `point` (ADR 0314). */
  line: (name: string) => ColumnDefinition;

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

  /**
   * Drops the existing column `column` (`schema.table` only), a contract step: `t.dropColumn("note", { after:
   * "orders.0007_stop_writing_note", type: "varchar(200)" })`. `after` is the migration of an earlier release that
   * stopped the code using the column; `stackra db migrate` refuses the step while that migration was applied by the
   * same run (or not at all), so a release still reading the column never meets it dropped. `type` is the column's
   * type, for the dev inverse, which adds it back nullable and empty. Never on a column this blueprint adds or changes.
   */
  dropColumn: (column: string, options: ContractOptions & RenamedColumnOptions) => void;

  /**
   * The expand step of a column rename (`schema.table` only): adds `to` with `options.type` (state its comment and
   * `.nullable()` on the returned column: it has no default and is not NOT NULL, so every row still to copy keeps `to`
   * null; a later `t.change` adds them after `t.finishRenameColumn`) and a trigger,
   * `trg_<table>_<from>_<to>`, that keeps the two equal on every insert and update, so the release that writes `from`
   * and the one that writes `to` run side by side. A `Backfill` copies the existing rows (`pending: "<to> is null and
   * <from> is not null"`); `t.finishRenameColumn` drops the trigger and `from` in a later release. Indexes and
   * constraints of `from` are not copied: add the ones `to` needs.
   */
  renameColumn: (from: string, to: string, options: RenamedColumnOptions) => ColumnDefinition;

  /**
   * The contract step of a column rename (`schema.table` only), in a later release than `t.renameColumn`: refuses
   * while a row still has `to` null and `from` set (the backfill has not reached it), then drops the sync trigger and
   * `from`. `after` is the release whose code stopped using `from`, gated as `dropColumn`; `type` is `from`'s type, for
   * the dev inverse.
   */
  finishRenameColumn: (
    from: string,
    to: string,
    options: ContractOptions & RenamedColumnOptions,
  ) => void;

  /**
   * A named check constraint, `ck_<table>_<name>`, over `expression` (SQL over the row's columns, a literal):
   * `t.check("quantity_positive", "quantity > 0")`. On a table being created it is part of the transaction; on an
   * existing one it is added `NOT VALID` (new rows are checked at once) and validated in a step of its own, which
   * scans while writes go on (ADR 0159 d3).
   */
  check: (name: string, expression: string) => void;

  /**
   * Drops the check `ck_<table>_<name>` an earlier migration added (`schema.table` only); it only relaxes the table,
   * so it waits for no release. `expression` is the check as it was, for the dev inverse, which adds it back
   * `NOT VALID`; `table` names the table it was created under when the table was renamed since.
   */
  dropCheck: (
    name: string,
    options: { readonly expression: string; readonly table?: string },
  ) => void;

  /**
   * An exclusion constraint, `ex_<table>_<name>`, on a table this migration creates: no two rows (meeting
   * `options.where`) have every element's operator true, such as `t.exclude("no_double_booking", { room_id: "=",
   * during: "&&" })`. GiST by default, which needs `Extension.BtreeGist` for `=` on a scalar column (ADR 0160 note of
   * 2026-11-03). Refused on an existing table: Postgres builds its index under an exclusive lock and has no online
   * form, so a large table gets a new table, or a reviewed `schema.sql` on a small one.
   */
  exclude: (
    name: string,
    elements: Readonly<Record<string, string>>,
    options?: ExclusionOptions,
  ) => void;

  /**
   * Drops the index `idx_<table>_<columns>` an earlier migration built (`schema.table` only), concurrently in its own
   * step. `options` states how it was built, for the dev inverse, which builds it again concurrently.
   */
  dropIndex: (columns: readonly string[], options?: DroppedIndexOptions) => void;

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
   * `platform` is the platform form of a nullable id column (ADR 0239 amendment, gap C): a set session reads its rows and
   * the null rows and writes only its own, a session with the setting unset reads and writes only the null rows, and
   * the restrictive `pol_<table>_<column>_write_update` and `_write_delete` keep those commands on the session's rows.
   * `restrictive: true` writes it `AS RESTRICTIVE`: it narrows the one permissive policy, and an unset or `''` setting
   * does not narrow (ADR 0347 d2 and d3); `exemptNull: column` also lets through that column's null rows on a path at or above a granted path. On a table being created the column is defined in the same blueprint; on an
   * existing table it may be one an earlier migration wrote (a public id for an id match, `scope_path` for a path
   * match). A blueprint takes one permissive policy, as Postgres ORs them, and one policy per column. A business table
   * keeps the equality policy @stackra/tenancy generates (ADR 0239, ADR 0327 d8).
   */
  rowLevelSecurity: (column: string, options: RowLevelSecurityOptions) => void;

  /**
   * Drops the policy `pol_<table>_<column>` an earlier migration created with `options` (`schema.table` only), before
   * this blueprint's policies, so a contract step can replace it: `t.dropRowLevelSecurity("scope_path", { setting:
   * "app.scope_paths", match: "ancestor" })`. `options.table` names the table the policy was created under when the
   * table was renamed since (a rename keeps the policy's name). The dev inverse creates it again from `options`.
   */
  dropRowLevelSecurity: (
    column: string,
    options: RowLevelSecurityOptions & { readonly table?: string },
  ) => void;

  /**
   * Declares this table a platform table: no row of it can ever be tied to a tenant, so it holds no owner column and
   * no policy (ADR 0239 amendment, group (c)): `t.platformTable("one row per consumer class; a global log position")`.
   * The reason is required, one line, and the compiled migration carries it as
   * `-- stackra:platform-table <schema>.<table> <reason>`, which `assertRowSecurity` and gen's isolation test read.
   * Compiling refuses a blueprint that also writes a scope id, an isolation scope id, a column filled from a setting
   * or a policy; the audit refuses the table once it holds the owner column or a scope id. `stackra
   * row-security-declarations` lists every declaration for review.
   */
  platformTable: (reason: string) => void;

  /**
   * Declares this table's row security reviewed by hand: its policies, named in `policies`, have a shape the audit
   * does not derive (a pre-tenant route read through a setting), so the audit does not hold them to the one
   * permissive owner policy and does not run its owner probe. It still requires row-level security enabled and
   * forced and every named policy present, so it is never a blanket skip. The reason is required and one line; the
   * compiled migration carries `-- stackra:reviewed-policy <schema>.<table> <policy>[,<policy>] <reason>`.
   */
  reviewedPolicy: (reason: string, policies: readonly string[]) => void;

  /**
   * Lets a system lookup or claim read this tenant table before a tenant is known (ADR 0239 amendment, gap A), through
   * `SYSTEM_ACCESS_ROLE` (`NOLOGIN`, `NOBYPASSRLS`, no member) and only through a `schema.systemFunction` it owns:
   * `t.systemAccess({ select: ["id", "tenant_id", "available_at", "leased_until"], update: ["leased_until"], reason })`.
   * It creates the role when missing, grants it `USAGE` on the schema, `SELECT` on the `select` columns and `UPDATE`
   * on the `update` columns (column grants only), and writes the permissive policies
   * `pol_<table>_system_access_select` (`FOR SELECT TO` the role `USING (true)`) and, with `update` columns,
   * `pol_<table>_system_access_update` (`FOR UPDATE`, `USING (true) WITH CHECK (true)`). A claim's
   * `FOR UPDATE SKIP LOCKED` needs an `update` column. On a platform-form table (`match: "platform"`) declared in the
   * same blueprint, `update` columns also let the role through `pol_<table>_<column>_write_update`
   * (`... or current_user = 'stackra_system_access'`), which would otherwise keep a claim with no tenant on the NULL
   * rows; the audit accepts that suffix only there. The reason is required and one line; the compiled migration
   * carries `-- stackra:system-access <schema>.<table> select=<columns> [update=<columns>] <reason>`, which
   * `assertRowSecurity` holds the grants to, and `stackra row-security-declarations` lists it for review. Once per
   * blueprint, and never on a platform table.
   */
  systemAccess: (options: SystemAccessOptions) => void;
}
