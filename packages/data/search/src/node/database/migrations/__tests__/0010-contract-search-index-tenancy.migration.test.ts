/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractSearchIndexTenancyMigration`: one transactional step (the online owner index after
 *          it) that adds `tenant_id` to `search.indexes` filled from `app.tenant_id`, backfills a row at a tenant node
 *          (nlevel 3) from its scope, refuses a deeper row with its remedy before any change of the key or policy,
 *          replaces the `-` scope key with NULL under the key `(tenant_id, model, scope_key)`, NULLs not distinct, keeps
 *          a plain unique `(model, scope_key)` for the previous release's upsert, gives the table the platform form and
 *          its select-only system access, and writes `index_statuses` owned by the system-access role.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractSearchIndexTenancyMigration } from "#node/database/migrations/0010-contract-search-index-tenancy.migration";

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractSearchIndexTenancyMigration", () => {
  const { steps } = compileMigration(ContractSearchIndexTenancyMigration, { schema: "search" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");
  const at = (text: string) => statements.findIndex((statement) => statement.includes(text));

  it("runs everything but the online owner index in one transaction", () => {
    expect(step?.transactional).toBe(true);
    expect(steps).toHaveLength(2);
    expect(steps[1]?.transactional).toBe(false);
    expect(steps[1]?.sql.join("\n")).toMatch(/create index concurrently .*"tenant_id"/);
  });

  it("adds a nullable owner column filled from the call's tenant and backfills a tenant node's rows", () => {
    expect(sql).toMatch(
      /alter table "search"\."indexes" add column "tenant_id" varchar\(33\) default nullif\(current_setting\('app\.tenant_id', true\), ''\)/,
    );
    expect(sql).not.toMatch(/"tenant_id".* not null/);
    expect(statements).toContain(
      'update "search"."indexes" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path"::ltree) = 3',
    );
  });

  it("refuses a row below a tenant node with its remedy before the key or any policy changes", () => {
    const refusal = at("refused before any change");
    expect(statements[refusal]).toContain(
      'where "tenant_id" is null and (nlevel("scope_path"::ltree) > 3)',
    );
    expect(statements[refusal]).toContain("run search:reindex in each node''s tenant");
    expect(refusal).toBeLessThan(at('drop constraint "indexes_pkey"'));
    expect(refusal).toBeLessThan(at("create policy"));
  });

  it("replaces the - scope key with NULL under a key that keeps owners apart", () => {
    const drop = at('drop constraint "indexes_pkey"');
    const nulls = at(`set "scope_key" = null where "scope_key" = '-'`);
    const key = at('create unique index "idx_indexes_tenant_id_model_scope_key"');
    expect(drop).toBeLessThan(nulls);
    expect(at('alter column "scope_key" drop not null')).toBeLessThan(nulls);
    expect(nulls).toBeLessThan(key);
    expect(statements[key]).toContain('("tenant_id", "model", "scope_key") nulls not distinct');
  });

  it("keeps the previous release's upsert target and - key for one release", () => {
    const compat = at('create unique index "idx_indexes_model_scope_key"');
    expect(statements[compat]).toContain('on "search"."indexes" ("model", "scope_key")');
    expect(statements[compat]).not.toContain("nulls not distinct");
    expect(compat).toBeGreaterThan(at('drop constraint "indexes_pkey"'));
    expect(sql).not.toMatch(/check \([^)]*scope_key/);
  });

  it("gives the registry the platform form and select-only system access", () => {
    const own = `"tenant_id" is not distinct from ${OWNER_SETTING}`;
    expect(sql).toContain('alter table "search"."indexes" force row level security');
    expect(statements).toContain(
      `create policy "pol_indexes_tenant_id" on "search"."indexes" using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null) with check (${own})`,
    );
    expect(sql).not.toContain("or current_user = 'stackra_system_access'");
    expect(
      statements.some((statement) =>
        statement.startsWith(
          "-- stackra:system-access search.indexes select=model,tenant_id,scope_key,scope_id,scope_path,state,facet_hash,doc_count,cursor,rebuilt_at,version ",
        ),
      ),
    ).toBe(true);
    expect(sql).not.toMatch(/system-access search\.indexes .*update=/);
  });

  it("writes index_statuses owned by the system-access role", () => {
    expect(
      statements.some((statement) =>
        statement.startsWith("-- stackra:system-function search.index_statuses "),
      ),
    ).toBe(true);
    expect(sql).toContain(
      'alter function "search"."index_statuses"() owner to "stackra_system_access"',
    );
  });
});
