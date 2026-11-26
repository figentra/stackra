/**
 * Stackra file contract:
 * Purpose: the twelfth migration of the workflow package (`workflow.0012_contract_journal_tenancy`): makes the native
 *          engine's journal, `runs`, `steps` and `signals`, tenant-owned in the platform form (ADR 0239 amendment, gap
 *          C), and gives the worker's tick its system functions (gap A). Each table gets `tenant_id` (nullable, filled
 *          from `app.tenant_id` by default, so every writer stores the call's tenant and never one from input; a NULL
 *          row is the platform's) and the one permissive policy `pol_<table>_tenant_id` with the restrictive
 *          `_write_update` and `_write_delete`. The tick claims due runs (`workflow.claim_due_runs`) and lapsed
 *          signals (`workflow.claim_expired_signals`) across tenants, ids, owners and order only, and the engine loads,
 *          advances or removes each in its owner's isolation.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online indexes runs in one transaction: the column, the backfill, the
 *           pre-flight, then per table its policies and system access in one blueprint. The backfill reads only the
 *           journal: tenants are recursive, so only a scope at `nlevel(scope_path) = 3` is certainly a tenant, whose
 *           `scope_id` becomes a run's tenant; a run with no scope or at the root or a product node stays a platform
 *           run. A step takes its run's tenant, and a held signal that a waiting run of its scope awaits takes that
 *           run's; a signal no run awaits yet is read like a run, by its own scope (the same scope a run that takes it
 *           will have). A run or a signal deeper than a tenant node is refused, naming each table's count and the
 *           remedy, so a refusal changes nothing; a step of a refused run is refused with it. `automations`,
 *           `checklists` and `checklist_progresses` keep migration 0011's tenant policies, and `service_ack_sets`
 *           stays a platform table. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decisions 1 and 2); ADR 0327
 *                     (decisions 2 and 8: the tenant level); ADR 0159 (as amended: expand and contract); ADR 0102
 *                     (decision 1: the journal).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The platform form of the tenant column. */
const PLATFORM = { setting: "app.tenant_id", match: "platform" } as const;

/** The owner column's comment. */
const OWNER =
  "The owning tenant, or NULL for a platform row; filled from the call's tenant, never from input.";

/** What an environment refused for runs does first. */
const RUNS =
  "A workflow run below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Finish or cancel the running, waiting and compensating workflows below a tenant node, delete those runs (their steps go with them), then migrate again.";

/** What an environment refused for held signals does first. */
const SIGNALS =
  "A held signal below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Let the waiting runs take those signals, or delete them (an untaken signal lapses after workflow.signalRetention), then migrate again.";

/** Makes the journal tables tenant-owned in the platform form. */
export class ContractJournalTenancyMigration extends Migration {
  /** The columns, the backfill, the pre-flight, the policies and system access, then the claims. */
  up(schema: SchemaBuilder): void {
    for (const table of ["runs", "steps", "signals"])
      schema.table(table, (t: Blueprint) => {
        t.link("tenant_id").nullable().defaultSetting("app.tenant_id").comment(OWNER);
      });
    schema.sql(
      'update "workflow"."runs" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3',
      { inverse: false },
    );
    schema.sql(
      'update "workflow"."steps" as s set "tenant_id" = r."tenant_id" from "workflow"."runs" as r where s."run_id" = r."id" and s."tenant_id" is null and r."tenant_id" is not null',
      { inverse: false },
    );
    schema.sql(
      'update "workflow"."signals" as g set "tenant_id" = r."tenant_id" from "workflow"."runs" as r join "workflow"."steps" as s on s."run_id" = r."id" where g."tenant_id" is null and r."tenant_id" is not null and s."status" = \'waiting\' and s."signal" = g."signal" and s."correlation" = g."correlation" and r."scope_id" is not distinct from g."scope_id"',
      { inverse: false },
    );
    schema.sql(
      'update "workflow"."signals" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3',
      { inverse: false },
    );
    schema.refuseNulls("tenant_id", ["runs"], RUNS, { where: 'nlevel("scope_path") > 3' });
    schema.refuseNulls("tenant_id", ["signals"], SIGNALS, { where: 'nlevel("scope_path") > 3' });
    schema.table("runs", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["id", "tenant_id", "status", "scope_id", "started_at", "deadline_at"],
        reason:
          "the worker's tick claims the due runs of every tenant, then advances each in its tenant",
      });
    });
    schema.table("steps", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["run_id", "status", "signal", "correlation", "wake_at"],
        reason: "the tick's claim finds the waiting runs whose wait passed or whose signal is held",
      });
    });
    schema.table("signals", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", PLATFORM);
      t.systemAccess({
        select: ["id", "tenant_id", "signal", "correlation", "scope_id", "expires_at"],
        reason:
          "the tick's claims match held signals to waiting runs and find lapsed ones across tenants",
      });
    });
    schema.systemFunction({
      name: "claim_due_runs",
      args: { due_at: "timestamptz", max_runs: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)", started_at: "timestamptz" },
      sql: [
        "select r.id, r.tenant_id, r.started_at from workflow.runs r",
        "where r.status in ('running', 'compensating') or (r.status = 'waiting' and (r.deadline_at <= due_at",
        "  or exists (select 1 from workflow.steps s where s.run_id = r.id and s.status = 'waiting'",
        "    and (s.wake_at <= due_at or exists (select 1 from workflow.signals g",
        "      where g.signal = s.signal and g.correlation = s.correlation",
        "      and g.scope_id is not distinct from r.scope_id and g.tenant_id is not distinct from r.tenant_id)))))",
        "order by r.started_at, r.id limit max_runs",
      ].join("\n"),
      reason:
        "the worker's tick claims the due runs of every tenant, then loads and advances each in its tenant",
    });
    schema.systemFunction({
      name: "claim_expired_signals",
      args: { expired_before: "timestamptz", max_signals: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)" },
      sql: [
        "select g.id, g.tenant_id from workflow.signals g",
        "where g.expires_at <= expired_before order by g.expires_at, g.id limit max_signals",
      ].join("\n"),
      reason: "the tick claims lapsed held signals of every tenant, then removes them per tenant",
    });
  }
}
