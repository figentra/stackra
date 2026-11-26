/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractJournalTenancyMigration`: one transactional step (the online owner indexes after it)
 *          that adds `tenant_id` to `runs`, `steps` and `signals` filled from `app.tenant_id`, backfills a run at a
 *          tenant node (nlevel 3) from its scope, a step from its run and a signal from the run that awaits it (else
 *          its own scope), refuses a run or signal deeper than a tenant node with each remedy before any policy, then
 *          gives each table the platform form and its select-only system access in one blueprint, and writes the two
 *          claims, each owned by the system-access role.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractJournalTenancyMigration } from "#node/database/migrations/0012-contract-journal-tenancy.migration";

/** Every table this migration makes tenant-owned. */
const TABLES = ["runs", "steps", "signals"];

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractJournalTenancyMigration", () => {
  const { steps } = compileMigration(ContractJournalTenancyMigration, { schema: "workflow" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");
  const at = (text: string) => statements.findIndex((statement) => statement.includes(text));

  it("runs everything but the online owner indexes in one transaction", () => {
    expect(step?.transactional).toBe(true);
    expect(steps.length).toBeGreaterThan(1);
    for (const online of steps.slice(1)) {
      expect(online.transactional).toBe(false);
      expect(online.sql.join("\n")).toMatch(/create index concurrently .*"tenant_id"/);
    }
  });

  it("adds a nullable owner column filled from the call's tenant, never from input", () => {
    for (const table of TABLES)
      expect(sql).toMatch(
        new RegExp(
          `alter table "workflow"\\."${table}" add column "tenant_id" varchar\\(33\\) default nullif\\(current_setting\\('app\\.tenant_id', true\\), ''\\)`,
        ),
      );
    expect(sql).not.toMatch(/add column "tenant_id"[^\n]* not null/);
  });

  it("backfills runs by their scope, steps and awaited signals by their run, then refuses deeper rows", () => {
    expect(statements).toContain(
      'update "workflow"."runs" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3',
    );
    const stepFill = at('update "workflow"."steps" as s set "tenant_id" = r."tenant_id"');
    const awaited = at('update "workflow"."signals" as g set "tenant_id" = r."tenant_id"');
    const unawaited = at(
      'update "workflow"."signals" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3',
    );
    expect(stepFill).toBeGreaterThan(at('update "workflow"."runs"'));
    expect(awaited).toBeGreaterThan(stepFill);
    expect(unawaited).toBeGreaterThan(awaited);
    expect(statements[awaited]).toContain('r."scope_id" is not distinct from g."scope_id"');
    const refusals = statements.filter((statement) =>
      statement.startsWith("do $$\ndeclare\n  found"),
    );
    expect(refusals).toHaveLength(2);
    expect(refusals.join("\n")).toContain(
      'where "tenant_id" is null and (nlevel("scope_path") > 3)',
    );
    expect(refusals.join("\n")).toContain("Finish or cancel the running, waiting and compensating");
    expect(refusals.join("\n")).toContain("Let the waiting runs take those signals");
    const firstPolicy = at("create policy");
    for (const refusal of refusals) expect(statements.indexOf(refusal)).toBeLessThan(firstPolicy);
  });

  it("gives every journal table the platform form, with no system-role update", () => {
    for (const table of TABLES) {
      const qualified = `"workflow"."${table}"`;
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

  it("declares select-only system access on each claimed table", () => {
    for (const declaration of [
      "-- stackra:system-access workflow.runs select=id,tenant_id,status,scope_id,started_at,deadline_at ",
      "-- stackra:system-access workflow.steps select=run_id,status,signal,correlation,wake_at ",
      "-- stackra:system-access workflow.signals select=id,tenant_id,signal,correlation,scope_id,expires_at ",
    ])
      expect(statements.some((statement) => statement.startsWith(declaration))).toBe(true);
    expect(sql).not.toMatch(/stackra:system-access workflow\.\w+ select=\S+ update=/);
  });

  it("writes each claim owned by the system-access role, returning ids, owners and order only", () => {
    for (const name of ["claim_due_runs", "claim_expired_signals"]) {
      expect(
        statements.some((statement) =>
          statement.startsWith(`-- stackra:system-function workflow.${name} `),
        ),
      ).toBe(true);
      expect(sql).toMatch(
        new RegExp(
          `alter function "workflow"\\."${name}"\\(.*\\) owner to "stackra_system_access"`,
        ),
      );
    }
    expect(sql).toContain("g.tenant_id is not distinct from r.tenant_id");
    expect(sql).not.toMatch(/returns table \([^)]*"(input|origin|payload|result|error)"/);
  });
});
