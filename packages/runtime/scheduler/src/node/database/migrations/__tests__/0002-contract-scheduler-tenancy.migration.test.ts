/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractSchedulerTenancyMigration`: one transactional step (the online owner index after it)
 *          that adds `tenant_id` to `scheduler.schedules` filled from `app.tenant_id`, backfills a schedule at a tenant
 *          node (nlevel 3) from its scope, refuses a deeper one with its remedy before any policy, then gives the table
 *          the platform form and its select-only system access in one blueprint, and writes the tick's claim function,
 *          owned by the system-access role and returning no input or scope.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractSchedulerTenancyMigration } from "#node/database/migrations/0002-contract-scheduler-tenancy.migration";

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractSchedulerTenancyMigration", () => {
  const { steps } = compileMigration(ContractSchedulerTenancyMigration, { schema: "scheduler" });
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

  it("adds a nullable owner column filled from the call's tenant, never from input", () => {
    expect(sql).toMatch(
      /alter table "scheduler"\."schedules" add column "tenant_id" varchar\(33\) default nullif\(current_setting\('app\.tenant_id', true\), ''\)/,
    );
    expect(sql).not.toMatch(/"tenant_id".* not null/);
  });

  it("backfills a schedule at a tenant node from its scope, then refuses a deeper one with its remedy", () => {
    expect(statements).toContain(
      `update "scheduler"."schedules" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
    );
    const refusals = statements.filter((statement) =>
      statement.startsWith("do $$\ndeclare\n  found"),
    );
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain('where "tenant_id" is null and (nlevel("scope_path") > 3)');
    expect(refusals[0]).toContain(
      "unschedule it, migrate again, then schedule it again from a call in its scope",
    );
    expect(statements.indexOf(refusals[0] ?? "")).toBeLessThan(at("create policy"));
  });

  it("gives the schedule table the platform form, the system role kept off its writes", () => {
    const own = `"tenant_id" is not distinct from ${OWNER_SETTING}`;
    expect(sql).toContain(`alter table "scheduler"."schedules" force row level security`);
    expect(statements).toContain(
      `create policy "pol_schedules_tenant_id" on "scheduler"."schedules" using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null) with check (${own})`,
    );
    expect(statements).toContain(
      `create policy "pol_schedules_tenant_id_write_delete" on "scheduler"."schedules" as restrictive for delete using (${own})`,
    );
    expect(sql).not.toContain("or current_user = 'stackra_system_access'");
  });

  it("declares select-only system access and the claim function, returning no input or scope", () => {
    expect(
      statements.some((statement) =>
        statement.startsWith(
          "-- stackra:system-access scheduler.schedules select=id,tenant_id,job_key,cron,time_zone,misfire,created_at ",
        ),
      ),
    ).toBe(true);
    expect(sql).not.toContain("scheduler.watermarks select=");
    expect(
      statements.some((statement) =>
        statement.startsWith("-- stackra:system-function scheduler.claim_schedules "),
      ),
    ).toBe(true);
    expect(sql).toMatch(
      /alter function "scheduler"\."claim_schedules"\(.*\) owner to "stackra_system_access"/,
    );
    expect(sql).not.toMatch(/returns table \([^)]*"(input|scope_id|scope_path)"/);
  });
});
