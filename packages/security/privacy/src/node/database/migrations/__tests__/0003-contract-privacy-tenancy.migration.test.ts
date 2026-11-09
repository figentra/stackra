/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractPrivacyTenancyMigration`: one transactional step (the online owner indexes after it)
 *          that per table drops the old `-` partition policy, adds `tenant_id` filled from `app.tenant_id`, copies the
 *          partition exactly (`nullif(scope_id, '-')`) and keeps the partition column nullable, filled on insert for
 *          the previous release (whose salt upsert keeps its unique index); keys a salt by
 *          `(tenant_id, subject)` with NULLs not distinct; gives each table the platform form, the holds their
 *          select-only system access, and writes `claim_live_holds` owned by the system-access role.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractPrivacyTenancyMigration } from "#node/database/migrations/0003-contract-privacy-tenancy.migration";

const TABLES = ["subject_salts", "legal_holds", "legal_hold_refusals"];

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractPrivacyTenancyMigration", () => {
  const { steps } = compileMigration(ContractPrivacyTenancyMigration, { schema: "privacy" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");
  const at = (text: string) => statements.findIndex((statement) => statement.includes(text));

  it("runs everything but the online indexes in one transaction", () => {
    expect(step?.transactional).toBe(true);
    for (const online of steps.slice(1)) {
      expect(online.transactional).toBe(false);
      expect(online.sql.join("\n")).toMatch(/create index concurrently .*"tenant_id"/);
    }
    const online = steps.slice(1).flatMap((part) => part.sql);
    expect(online.join("\n")).toContain(
      'create index concurrently "idx_legal_holds_tenant_id_record_id" on "privacy"."legal_holds" ("tenant_id", "record_id") where released_at is null',
    );
  });

  it("moves each table's - partition into an owner column, copied exactly, and keeps the old column nullable", () => {
    for (const table of TABLES) {
      const qualified = `"privacy"."${table}"`;
      const dropPolicy = at(`drop policy "pol_${table}_scope_id" on ${qualified}`);
      const add = at(`alter table ${qualified} add column "tenant_id" varchar(33) default`);
      const copy = at(`update ${qualified} set "tenant_id" = nullif("scope_id", '-')`);
      const nullable = at(`alter table ${qualified} alter column "scope_id" drop not null`);
      expect(dropPolicy).toBeGreaterThanOrEqual(0);
      expect(dropPolicy).toBeLessThan(add);
      expect(add).toBeLessThan(copy);
      expect(copy).toBeLessThan(nullable);
    }
    expect(sql).not.toContain('drop column "scope_id"');
    expect(sql).not.toMatch(/add column "tenant_id"[^\n]* not null/);
    expect(sql).not.toContain("refused before any change");
  });

  it("keys a salt by owner and subject, the platform's colliding only with its own", () => {
    expect(sql).toContain(
      'create unique index "idx_subject_salts_tenant_id_subject" on "privacy"."subject_salts" ("tenant_id", "subject") nulls not distinct',
    );
    expect(at('create unique index "idx_subject_salts_tenant_id_subject"')).toBeGreaterThan(
      at('alter table "privacy"."subject_salts" alter column "scope_id" drop not null'),
    );
  });

  it("keeps the previous release's reads and upserts working for one release", () => {
    const pkey = at('drop constraint "subject_salts_pkey"');
    const legacyKey = at(
      'create unique index "idx_subject_salts_scope_id_subject" on "privacy"."subject_salts" ("scope_id", "subject")',
    );
    expect(pkey).toBeGreaterThanOrEqual(0);
    expect(legacyKey).toBeGreaterThan(pkey);
    expect(statements[legacyKey]).not.toContain("nulls not distinct");
    const fill = at("create function privacy.fill_legacy_scope_id() returns trigger");
    expect(statements[fill]).toContain(
      "if new.scope_id is null then new.scope_id := coalesce(new.tenant_id, '-'); end if;",
    );
    for (const table of TABLES)
      expect(statements).toContain(
        `create trigger "trg_${table}_legacy_scope_id" before insert on "privacy"."${table}" for each row execute function privacy.fill_legacy_scope_id()`,
      );
  });

  it("gives every table the platform form", () => {
    for (const table of TABLES) {
      const qualified = `"privacy"."${table}"`;
      const own = `"tenant_id" is not distinct from ${OWNER_SETTING}`;
      expect(sql).toContain(`alter table ${qualified} force row level security`);
      expect(statements).toContain(
        `create policy "pol_${table}_tenant_id" on ${qualified} using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null) with check (${own})`,
      );
      expect(statements).toContain(
        `create policy "pol_${table}_tenant_id_write_delete" on ${qualified} as restrictive for delete using (${own})`,
      );
    }
    expect(sql).not.toContain("or current_user = 'stackra_system_access'");
  });

  it("declares the holds' select-only system access and the claim owned by the system-access role", () => {
    expect(
      statements.some((statement) =>
        statement.startsWith(
          "-- stackra:system-access privacy.legal_holds select=id,tenant_id,record_id,released_at ",
        ),
      ),
    ).toBe(true);
    expect(sql).not.toContain("privacy.subject_salts select=");
    expect(sql).not.toContain("privacy.legal_hold_refusals select=");
    expect(sql).toMatch(
      /alter function "privacy"\."claim_live_holds"\(jsonb\) owner to "stackra_system_access"/,
    );
    expect(sql).not.toMatch(/returns table \([^)]*"(reason|salt|model)"/);
  });
});
