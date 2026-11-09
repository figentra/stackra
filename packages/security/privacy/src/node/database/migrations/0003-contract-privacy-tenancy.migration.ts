/**
 * Stackra file contract:
 * Purpose: the third migration of the privacy package (`privacy.0003_contract_privacy_tenancy`): makes
 *          `subject_salts`, `legal_holds` and `legal_hold_refusals` tenant-owned in the platform form (ADR 0239
 *          amendment, gap C). Each table moves its `scope_id` partition, which held `-` for a session in no tenant,
 *          into `tenant_id` (nullable, filled from `app.tenant_id` by default, so every writer stores the call's tenant
 *          and never one from input; a NULL row is the platform's) under the one permissive policy
 *          `pol_<table>_tenant_id` with the restrictive `_write_update` and `_write_delete`. A subject's salt is keyed
 *          `(tenant_id, subject)`, NULLs not distinct, so the platform keeps one salt per subject as a tenant does. A
 *          system run's hold check claims the live holds of every tenant through `privacy.claim_live_holds` (gap A).
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online indexes runs in one transaction. The backfill is exact: the old
 *           partition named the tenant, so `tenant_id` is `nullif(scope_id, '-')` and nothing is refused. The old
 *           policies, written with `schema.sql` by 0001 and 0002, are dropped. Expand step for one release: `scope_id`
 *           stays, nullable and unused by this release's code, so the previous release still reads and writes during a
 *           rolling deploy. `privacy.fill_legacy_scope_id` fills it on insert from `tenant_id` (`-` for a platform
 *           row), so the previous release sees this release's rows, and the salts' primary key gives way to a unique
 *           index on `(scope_id, subject)` that the previous release's upsert infers. The contract step, a later
 *           release, drops the triggers, the function, that index and `scope_id`. No `down()`: gen derives the dev
 *           inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decisions 1 and 2); ADR 0134 (2026-10-24
 *                     amendment: holds); ADR 0212 (crypto-shredding); ADR 0159 (as amended).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The platform form of the tenant column. */
const PLATFORM = { setting: "app.tenant_id", match: "platform" } as const;

/** The old partition each table's policy compared, `-` for a session in no tenant. */
const PARTITION = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";

/** The old partition column's comment while it stays for the previous release. */
const LEGACY =
  "The old tenant partition (- outside a tenant), kept for the previous release only: filled on insert from tenant_id, read by nothing in this release, dropped by the contract step.";

/** The owner column's comment. */
const OWNER =
  "The owning tenant, or NULL for a platform row; filled from the call's tenant, never from input.";

/** Makes the privacy tables tenant-owned in the platform form. */
export class ContractPrivacyTenancyMigration extends Migration {
  /** Per table: the old policy off, the owner column and its exact backfill, the old column kept; then the new forms. */
  up(schema: SchemaBuilder): void {
    for (const table of ["subject_salts", "legal_holds", "legal_hold_refusals"]) {
      const qualified = `"privacy"."${table}"`;
      schema.sql(`drop policy "pol_${table}_scope_id" on ${qualified}`, {
        inverse:
          `create policy "pol_${table}_scope_id" on ${qualified} ` +
          `using ("scope_id" = ${PARTITION}) with check ("scope_id" = ${PARTITION})`,
      });
      schema.table(table, (t: Blueprint) => {
        t.link("tenant_id").nullable().defaultSetting("app.tenant_id").comment(OWNER);
      });
      schema.sql(`update ${qualified} set "tenant_id" = nullif("scope_id", '-')`, {
        inverse: false,
      });
      if (table === "subject_salts") {
        // the previous release's `on conflict (scope_id, subject)` infers this index once the key may be null
        schema.sql(
          "-- lint: the salt table's key swap keeps an index on the same columns, built in the migration's transaction.\n" +
            "-- squawk-ignore ban-drop-constraint\n" +
            'alter table "privacy"."subject_salts" drop constraint "subject_salts_pkey"',
          {
            inverse:
              'alter table "privacy"."subject_salts" add primary key ("scope_id", "subject")',
          },
        );
        schema.sql(
          "-- squawk-ignore require-concurrent-index-creation\n" +
            'create unique index "idx_subject_salts_scope_id_subject" on "privacy"."subject_salts" ("scope_id", "subject")',
          { inverse: 'drop index if exists "privacy"."idx_subject_salts_scope_id_subject"' },
        );
      }
      schema.sql(`alter table ${qualified} alter column "scope_id" drop not null`, {
        inverse: `alter table ${qualified} alter column "scope_id" set not null`,
      });
      schema.sql(`comment on column ${qualified}."scope_id" is '${LEGACY}'`, { inverse: false });
    }
    // raw-sql: a trigger has no blueprint form; it keeps the previous release's reads whole for one release
    schema.sql(
      [
        "create function privacy.fill_legacy_scope_id() returns trigger",
        "language plpgsql set search_path = pg_catalog, pg_temp as $fill$",
        "begin",
        "  if new.scope_id is null then new.scope_id := coalesce(new.tenant_id, '-'); end if;",
        "  return new;",
        "end",
        "$fill$",
      ].join("\n"),
      { inverse: "drop function if exists privacy.fill_legacy_scope_id()" },
    );
    for (const table of ["subject_salts", "legal_holds", "legal_hold_refusals"])
      schema.sql(
        `create trigger "trg_${table}_legacy_scope_id" before insert on "privacy"."${table}" ` +
          "for each row execute function privacy.fill_legacy_scope_id()",
        {
          inverse: `drop trigger if exists "trg_${table}_legacy_scope_id" on "privacy"."${table}"`,
        },
      );
    // raw-sql: a unique index with NULLS NOT DISTINCT has no blueprint form; `obtain` upserts on it in this release
    schema.sql(
      "-- squawk-ignore require-concurrent-index-creation\n" +
        'create unique index "idx_subject_salts_tenant_id_subject" on "privacy"."subject_salts" ' +
        '("tenant_id", "subject") nulls not distinct',
      { inverse: 'drop index if exists "privacy"."idx_subject_salts_tenant_id_subject"' },
    );
    schema.table("subject_salts", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
    });
    schema.table("legal_holds", (t: Blueprint) => {
      t.index(["tenant_id", "record_id"]).where("released_at is null").concurrently();
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["id", "tenant_id", "record_id", "released_at"],
        reason:
          "a system run's hold check (retention, partition upkeep) claims live holds across tenants",
      });
    });
    schema.table("legal_hold_refusals", (t: Blueprint) => {
      t.index(["tenant_id", "record_id"]).concurrently();
      t.rowLevelSecurity("tenant_id", PLATFORM);
    });
    schema.systemFunction({
      name: "claim_live_holds",
      args: { record_ids: "jsonb" },
      returns: { id: "varchar(63)", tenant_id: "varchar(33)" },
      sql: [
        "select h.id, h.tenant_id from privacy.legal_holds h",
        "where h.released_at is null and h.record_id in (select jsonb_array_elements_text(record_ids))",
        "order by h.tenant_id nulls first, h.id",
      ].join("\n"),
      reason:
        "a system run claims the live holds of every tenant on its records, then checks and logs each tenant's in it",
    });
  }
}
