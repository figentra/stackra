/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractQueueTenancyMigration`: one transactional step (the online owner index after it) that
 *          adds `tenant_id` to `queue.jobs` filled from `app.tenant_id`, backfills a job at a tenant node (depth 3) from
 *          its scope, refuses a deeper job with the drain remedy before any policy, then gives the table the platform
 *          form and its system access (the lease columns writable) in one blueprint, and writes the system functions,
 *          each owned by the system-access role and returning ids and owners only.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractQueueTenancyMigration } from "#node/database/migrations/0003-contract-queue-tenancy.migration";

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractQueueTenancyMigration", () => {
  const { steps } = compileMigration(ContractQueueTenancyMigration, { schema: "queue" });
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
      /alter table "queue"\."jobs" add column "tenant_id" varchar\(33\) default nullif\(current_setting\('app\.tenant_id', true\), ''\)/,
    );
    expect(sql).not.toMatch(/"tenant_id".* not null/);
  });

  it("backfills a job at a tenant node from its scope, then refuses a deeper one with the drain remedy", () => {
    expect(statements).toContain(
      `update "queue"."jobs" set "tenant_id" = "scope_id" where "tenant_id" is null and cardinality(string_to_array("scope_path", '.')) = 3`,
    );
    const refusals = statements.filter((statement) =>
      statement.startsWith("do $$\ndeclare\n  found"),
    );
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain(
      `where "tenant_id" is null and (cardinality(string_to_array("scope_path", '.')) > 3)`,
    );
    expect(refusals[0]).toContain(
      "Drain the queue first: let reserved and pending jobs finish or fail, delete those dead jobs, then migrate again.",
    );
    expect(statements.indexOf(refusals[0] ?? "")).toBeLessThan(at("create policy"));
  });

  it("gives the job table the platform form, letting the system role through the write policy for a lease", () => {
    const own = `"tenant_id" is not distinct from ${OWNER_SETTING}`;
    expect(sql).toContain(`alter table "queue"."jobs" force row level security`);
    expect(statements).toContain(
      `create policy "pol_jobs_tenant_id" on "queue"."jobs" using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null) with check (${own})`,
    );
    expect(statements).toContain(
      `create policy "pol_jobs_tenant_id_write_delete" on "queue"."jobs" as restrictive for delete using (${own})`,
    );
    expect(sql).toContain(
      `create policy "pol_jobs_tenant_id_write_update" on "queue"."jobs" as restrictive for update using ((${own}) or current_user = 'stackra_system_access')`,
    );
  });

  it("declares the job table's system access: the claim's columns, and the lease columns writable", () => {
    expect(
      statements.some((statement) =>
        statement.startsWith(
          "-- stackra:system-access queue.jobs select=id,tenant_id,queue,scope_id,status,attempts,run_at,locked_until,lease,priority,scope_concurrency,unique_key update=status,attempts,locked_until ",
        ),
      ),
    ).toBe(true);
    expect(sql).not.toContain("queue.job_batches select=");
  });

  it("writes each system function owned by the system-access role, returning ids and owners only", () => {
    for (const name of ["reserve_job", "claim_dead_jobs", "unique_key_holders"]) {
      expect(
        statements.some((statement) =>
          statement.startsWith(`-- stackra:system-function queue.${name} `),
        ),
      ).toBe(true);
      expect(sql).toMatch(
        new RegExp(`alter function "queue"\\."${name}"\\(.*\\) owner to "stackra_system_access"`),
      );
    }
    expect(sql).toContain("limit 1 for update of job skip locked");
    expect(sql).not.toMatch(/returns table \([^)]*"(input|origin|last_error|chain)"/);
    expect(at("reserve_job")).toBeGreaterThan(at('create policy "pol_jobs_tenant_id"'));
  });
});
