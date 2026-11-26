/**
 * Stackra file contract:
 * Purpose: the fourth migration of the settings package (`settings.0004_contract_settings_tenancy`): makes
 *          `stored_settings` and `stored_setting_revisions` tenant-owned in the platform form (ADR 0239 amendment, gap
 *          C). Each table gets `tenant_id` (nullable, filled from `app.tenant_id` by default, so every writer stores the
 *          call's tenant and never one from input; a NULL row is the platform's) and the one permissive policy
 *          `pol_<table>_tenant_id` with the restrictive `_write_update` and `_write_delete`. A user's row is keyed by
 *          its tenant: the unique `(group_key, user_id)` becomes `(tenant_id, group_key, user_id)` over user rows, NULLs
 *          not distinct, so a platform row and a tenant's row of one user never collide and two platform rows still
 *          do. The scheduler's due revisions are claimed across tenants through `settings.claim_due_revisions` (gap A).
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online indexes runs in one transaction: the column, the backfill, the
 *           pre-flights, the key, then per table its policies and system access in one blueprint. The backfill reads
 *           only the row: tenants are recursive, so only a node at `nlevel(scope_path) = 3` is certainly a tenant, whose
 *           `scope_id` becomes the row's tenant; a row at the root or a product node stays a platform row. A row deeper
 *           than a tenant node is refused, and so is a user's row: it names no node, so its tenant cannot be read, and
 *           kept as a platform row it would be readable by every tenant. Each refusal names its counts and the remedy,
 *           so a refusal changes nothing. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decisions 1 and 2); ADR 0327
 *                     (decisions 2 and 8: the tenant level); ADR 0213 (decisions 1, 2 and 5); ADR 0159 (as amended).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The platform form of the tenant column. */
const PLATFORM = { setting: "app.tenant_id", match: "platform" } as const;

/** The owner column's comment. */
const OWNER =
  "The owning tenant, or NULL for a platform row; filled from the call's tenant, never from input.";

/** What an environment refused for a node below a tenant node does first. */
const DEEP =
  "A setting or revision below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Record those nodes' values, delete their rows (nlevel(scope_path) > 3) from settings.stored_settings and settings.stored_setting_revisions, migrate again, then write the values again from a session in each node's tenant.";

/** What an environment refused for a user's row does first. */
const USERS =
  "A user's setting or revision names no scope node, so this migration cannot read its tenant, and kept as a platform row it would be readable by every tenant. Record those users' values, delete their rows (user_id is not null) from settings.stored_settings and settings.stored_setting_revisions, migrate again, then write the values again from a session in each user's tenant.";

/** What an environment refused by the new user key does first. */
const DUPLICATES =
  "Two user rows of one group share a tenant and a user, which the new key (tenant_id, group_key, user_id) refuses. Merge each pair into one row and delete the other, then migrate again.";

/** Makes the settings tables tenant-owned in the platform form. */
export class ContractSettingsTenancyMigration extends Migration {
  /** The columns, the backfill, the pre-flights, the user key, the policies and system access, then the claim. */
  up(schema: SchemaBuilder): void {
    for (const table of ["stored_settings", "stored_setting_revisions"])
      schema.table(table, (t: Blueprint) => {
        t.link("tenant_id").nullable().defaultSetting("app.tenant_id").comment(OWNER);
      });
    for (const table of ["stored_settings", "stored_setting_revisions"])
      schema.sql(
        `update "settings"."${table}" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
        { inverse: false },
      );
    schema.refuseNulls("tenant_id", ["stored_settings", "stored_setting_revisions"], DEEP, {
      where: 'nlevel("scope_path") > 3',
    });
    schema.refuseNulls("tenant_id", ["stored_settings", "stored_setting_revisions"], USERS, {
      where: '"user_id" is not null',
    });
    // raw-sql: a pre-flight with no schema-builder form; the remedy names the rows the new key would refuse
    schema.sql(
      [
        "do $$",
        "declare",
        "  n bigint;",
        "begin",
        '  select count(*) into n from (select 1 from "settings"."stored_settings" where "user_id" is not null',
        '    group by "tenant_id", "group_key", "user_id" having count(*) > 1) as duplicated;',
        "  if n > 0 then",
        `    raise exception 'refused before any change: settings.stored_settings %. %', n, '${DUPLICATES}';`,
        "  end if;",
        "end",
        "$$",
      ].join("\n"),
      { inverse: false },
    );
    // raw-sql: a unique index with NULLS NOT DISTINCT over user rows has no blueprint form; a small settings table
    schema.sql(
      "-- squawk-ignore require-concurrent-index-creation\n" +
        'create unique index "idx_stored_settings_tenant_id_group_key_user_id" on "settings"."stored_settings" ' +
        '("tenant_id", "group_key", "user_id") nulls not distinct where "user_id" is not null',
      {
        inverse:
          'drop index if exists "settings"."idx_stored_settings_tenant_id_group_key_user_id"',
      },
    );
    schema.sql('drop index "settings"."idx_stored_settings_group_key_user_id"', {
      inverse:
        'create unique index "idx_stored_settings_group_key_user_id" on "settings"."stored_settings" ("group_key", "user_id")',
    });
    schema.table("stored_settings", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
    });
    schema.table("stored_setting_revisions", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["id", "tenant_id", "status", "effective_at"],
        reason: "the scheduler claims due settings revisions across tenants",
      });
    });
    schema.systemFunction({
      name: "claim_due_revisions",
      args: { due_at: "timestamptz", max_rows: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)", effective_at: "timestamptz" },
      sql: [
        "select r.id, r.tenant_id, r.effective_at from settings.stored_setting_revisions r",
        "where r.status = 'scheduled' and r.effective_at <= due_at",
        "order by r.effective_at, r.id limit max_rows",
      ].join("\n"),
      reason: "the scheduler claims due revisions of every tenant, then applies each in its tenant",
    });
  }
}
