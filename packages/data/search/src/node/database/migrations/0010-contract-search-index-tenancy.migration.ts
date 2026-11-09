/**
 * Stackra file contract:
 * Purpose: the tenth migration of the search package (`search.0010_contract_search_index_tenancy`): makes the index
 *          registry `search.indexes` tenant-owned in the platform form (ADR 0239 amendment, gap C). It gets `tenant_id`
 *          (nullable, filled from `app.tenant_id` by default, so every reindex job stores its call's tenant and never
 *          one from input; a NULL row is the platform's) and the one permissive policy `pol_indexes_tenant_id` with the
 *          restrictive `_write_update` and `_write_delete`. A NULL `scope_key` replaces the `-` of a platform-wide index,
 *          and the key becomes `(tenant_id, model, scope_key)`, NULLs not distinct, so a tenant's and the platform's
 *          platform-wide index of one model stand side by side. `search:status` reads every tenant's indexes through
 *          `search.index_statuses` (gap A).
 *          Expand step for one release: the previous release still upserts `on conflict (model, scope_key)` and may
 *          write `-`, so the primary key gives way to a plain unique index on `(model, scope_key)` (NULLs distinct, so
 *          it never joins two NULL keys) that its upsert infers, and `-` stays a valid key. The contract step, a later
 *          release, sets each remaining `-` to NULL (deleting one whose owner already has a NULL row) and drops
 *          `idx_indexes_model_scope_key`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online owner index runs in one transaction: the column, the backfill, the
 *           pre-flight, the key, then the policies and system access in one blueprint, then the function. The backfill
 *           reads only the row: tenants are recursive, so only a scope at `nlevel(scope_path) = 3` is certainly a
 *           tenant, whose `scope_id` becomes the row's tenant; a row with no scope, at the root or at a product node
 *           stays a platform row. A row deeper than a tenant node is refused with the remedy, so a refusal changes
 *           nothing. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decisions 1 and 2); ADR 0327
 *                     (decisions 2 and 8: the tenant level); ADR 0404 (decision 3); ADR 0159 (as amended).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The platform form of the tenant column. */
const PLATFORM = { setting: "app.tenant_id", match: "platform" } as const;

/** What an environment refused for an index below a tenant node does first. */
const DEEP =
  "A search index below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Delete those rows (nlevel(scope_path) > 3) from search.indexes, which hold only a rebuild's state and counts, migrate again, then run search:reindex in each node's tenant to record them again.";

/** Makes the index registry tenant-owned in the platform form. */
export class ContractSearchIndexTenancyMigration extends Migration {
  /** The column, the backfill, the pre-flight, the key, the policies and system access, then the status read. */
  up(schema: SchemaBuilder): void {
    schema.table("indexes", (t: Blueprint) => {
      t.link("tenant_id")
        .nullable()
        .defaultSetting("app.tenant_id")
        .comment(
          "The owning tenant, or NULL for a platform row; filled from the call's tenant, never from input.",
        );
    });
    schema.sql(
      `update "search"."indexes" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path"::ltree) = 3`,
      { inverse: false },
    );
    schema.refuseNulls("tenant_id", ["indexes"], DEEP, {
      where: 'nlevel("scope_path"::ltree) > 3',
    });
    // raw-sql: a nullable key column and a unique index with NULLS NOT DISTINCT have no blueprint form
    schema.sql(
      "-- lint: the registry holds one row per model and scope, so the key swap is brief and needs no online build.\n" +
        "-- squawk-ignore ban-drop-constraint\n" +
        'alter table "search"."indexes" drop constraint "indexes_pkey"',
      {
        inverse: 'alter table "search"."indexes" add primary key ("model", "scope_key")',
      },
    );
    // the previous release's `on conflict (model, scope_key)` needs a unique index on exactly those columns
    schema.sql(
      "-- squawk-ignore require-concurrent-index-creation\n" +
        'create unique index "idx_indexes_model_scope_key" on "search"."indexes" ("model", "scope_key")',
      { inverse: 'drop index if exists "search"."idx_indexes_model_scope_key"' },
    );
    schema.sql('alter table "search"."indexes" alter column "scope_key" drop not null', {
      inverse: 'alter table "search"."indexes" alter column "scope_key" set not null',
    });
    schema.sql(
      `comment on column "search"."indexes"."scope_key" is 'The scope id the index serves, or NULL for a platform-wide index (- from the previous release until the contract step).'`,
      {
        inverse: `comment on column "search"."indexes"."scope_key" is 'The scope id the index serves, or - for a platform-wide index.'`,
      },
    );
    schema.sql(`update "search"."indexes" set "scope_key" = null where "scope_key" = '-'`, {
      inverse: `update "search"."indexes" set "scope_key" = '-' where "scope_key" is null`,
    });
    schema.sql(
      "-- squawk-ignore require-concurrent-index-creation\n" +
        'create unique index "idx_indexes_tenant_id_model_scope_key" on "search"."indexes" ' +
        '("tenant_id", "model", "scope_key") nulls not distinct',
      { inverse: 'drop index if exists "search"."idx_indexes_tenant_id_model_scope_key"' },
    );
    schema.table("indexes", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: [
          "model",
          "tenant_id",
          "scope_key",
          "scope_id",
          "scope_path",
          "state",
          "facet_hash",
          "doc_count",
          "cursor",
          "rebuilt_at",
          "version",
        ],
        reason: "search:status reads every tenant's index states and counts",
      });
    });
    schema.systemFunction({
      name: "index_statuses",
      args: {},
      returns: {
        model: "varchar(200)",
        tenant_id: "varchar(33)",
        scope_id: "varchar(33)",
        scope_path: "text",
        state: "text",
        facet_hash: "varchar(64)",
        doc_count: "integer",
        cursor: "text",
        rebuilt_at: "timestamptz",
        version: "integer",
      },
      sql: [
        "select i.model, i.tenant_id, i.scope_id, i.scope_path, i.state, i.facet_hash, i.doc_count, i.cursor,",
        "  i.rebuilt_at, i.version",
        "from search.indexes i order by i.model, i.tenant_id nulls first, i.scope_key nulls first",
      ].join("\n"),
      reason:
        "search:status lists the index registry of every tenant: states and counts, never row data",
    });
  }
}
