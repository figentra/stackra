/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractSettingsTenancyMigration`: one transactional step (the online owner indexes after it)
 *          that adds `tenant_id` to both settings tables filled from `app.tenant_id`, backfills a row at a tenant node
 *          (nlevel 3) from its scope, refuses a deeper row and a user's row with each remedy and a duplicate of the new
 *          user key before any policy, swaps the user key for `(tenant_id, group_key, user_id)` with NULLs not distinct,
 *          gives each table the platform form (the revisions with their system access) and writes the due claim owned
 *          by the system-access role.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractSettingsTenancyMigration } from "#node/database/migrations/0004-contract-settings-tenancy.migration";

const TABLES = ["stored_settings", "stored_setting_revisions"];

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractSettingsTenancyMigration", () => {
  const { steps } = compileMigration(ContractSettingsTenancyMigration, { schema: "settings" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");
  const at = (text: string) => statements.findIndex((statement) => statement.includes(text));

  it("runs everything but the online owner indexes in one transaction", () => {
    expect(step?.transactional).toBe(true);
    expect(steps.slice(1)).toHaveLength(2);
    for (const online of steps.slice(1)) {
      expect(online.transactional).toBe(false);
      expect(online.sql.join("\n")).toMatch(/create index concurrently .*"tenant_id"/);
    }
  });

  it("adds a nullable owner column filled from the call's tenant, never from input", () => {
    for (const table of TABLES)
      expect(sql).toMatch(
        new RegExp(
          `alter table "settings"\\."${table}" add column "tenant_id" varchar\\(33\\) default nullif\\(current_setting\\('app\\.tenant_id', true\\), ''\\)`,
        ),
      );
    expect(sql).not.toMatch(/add column "tenant_id"[^\n]* not null/);
  });

  it("backfills a tenant node's rows, then refuses deeper rows, user rows and duplicates before any policy", () => {
    for (const table of TABLES)
      expect(statements).toContain(
        `update "settings"."${table}" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
      );
    const refusals = statements.filter((statement) =>
      statement.startsWith("do $$\ndeclare\n  found"),
    );
    expect(refusals).toHaveLength(2);
    expect(refusals[0]).toContain('where "tenant_id" is null and (nlevel("scope_path") > 3)');
    expect(refusals[0]).toContain("a branch and a child tenant look alike");
    expect(refusals[1]).toContain('where "tenant_id" is null and ("user_id" is not null)');
    expect(refusals[1]).toContain("readable by every tenant");
    const duplicates = at('group by "tenant_id", "group_key", "user_id" having count(*) > 1');
    expect(statements[duplicates]).toContain("Merge each pair into one row");
    const firstPolicy = at("create policy");
    for (const refusal of refusals) expect(statements.indexOf(refusal)).toBeLessThan(duplicates);
    expect(duplicates).toBeLessThan(at('create unique index "idx_stored_settings_tenant_id'));
    expect(duplicates).toBeLessThan(firstPolicy);
  });

  it("keys a user's row by its tenant, a platform row colliding only with another platform row", () => {
    expect(sql).toContain(
      'create unique index "idx_stored_settings_tenant_id_group_key_user_id" on "settings"."stored_settings" ("tenant_id", "group_key", "user_id") nulls not distinct where "user_id" is not null',
    );
    expect(statements).toContain('drop index "settings"."idx_stored_settings_group_key_user_id"');
    expect(sql).not.toContain('drop index "settings"."idx_stored_settings_group_key_scope_id"');
  });

  it("gives both tables the platform form", () => {
    for (const table of TABLES) {
      const qualified = `"settings"."${table}"`;
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

  it("declares the revisions' select-only system access and the due claim owned by the system-access role", () => {
    expect(
      statements.some((statement) =>
        statement.startsWith(
          "-- stackra:system-access settings.stored_setting_revisions select=id,tenant_id,status,effective_at ",
        ),
      ),
    ).toBe(true);
    expect(sql).not.toContain("settings.stored_settings select=");
    expect(
      statements.some((statement) =>
        statement.startsWith("-- stackra:system-function settings.claim_due_revisions "),
      ),
    ).toBe(true);
    expect(sql).toMatch(
      /alter function "settings"\."claim_due_revisions"\(timestamptz, integer\) owner to "stackra_system_access"/,
    );
    expect(sql).not.toMatch(/returns table \([^)]*"(values|previous|author)"/);
  });
});
