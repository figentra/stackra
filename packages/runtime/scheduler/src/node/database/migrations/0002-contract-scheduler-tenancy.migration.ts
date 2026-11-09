/**
 * Stackra file contract:
 * Purpose: the second migration of the scheduler package (`scheduler.0002_contract_scheduler_tenancy`): makes
 *          `scheduler.schedules` tenant-owned in the platform form (ADR 0239 amendment, gap C) and gives the tick its
 *          system function (gap A). The table gets `tenant_id` (nullable, filled from `app.tenant_id` by default, so a
 *          schedule takes the tenant of the call that made it and never one from input; a NULL row is the platform's)
 *          and the one permissive policy `pol_schedules_tenant_id` with the restrictive `_write_update` and
 *          `_write_delete`. The tick claims every owner's schedules through `scheduler.claim_schedules` (ids, owners and
 *          what decides their runs) under its lock, then loads each due schedule and pushes its runs in its owner's
 *          isolation. `scheduler.watermarks` stays a platform table (tick bookkeeping).
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Everything but the online owner index runs in one transaction: the column, the backfill, the
 *           pre-flight, then the policies and system access in one blueprint, then the function. The backfill reads
 *           only the row: tenants are recursive, so only a scope at `nlevel(scope_path) = 3` is certainly a tenant,
 *           whose `scope_id` becomes the schedule's owner; a schedule at the root or a product node stays a platform
 *           schedule. A schedule deeper than a tenant node is refused, naming the count and the remedy, so a refusal
 *           changes nothing. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C, decision 5: the tick); ADR 0148 (decisions 4 and
 *                     5); ADR 0327 (decisions 2 and 8: the tenant level); ADR 0159 (as amended: expand and contract).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The owner column's comment. */
const OWNER =
  "The owning tenant, or NULL for a platform schedule; filled from the call's tenant, never from input.";

/** What an environment refused for schedules does first. */
const RESCHEDULE =
  "A schedule below a tenant node has no tenant this migration can read (a branch and a child tenant look alike without the scope tree). Note each such schedule's job, cron, time zone, input and missed-run policy, unschedule it, migrate again, then schedule it again from a call in its scope, which stores its tenant.";

/** Makes the schedule table tenant-owned in the platform form. */
export class ContractSchedulerTenancyMigration extends Migration {
  /** The column, the backfill, the pre-flight, the policies and system access, then the function. */
  up(schema: SchemaBuilder): void {
    schema.table("schedules", (t: Blueprint) => {
      t.link("tenant_id").nullable().defaultSetting("app.tenant_id").comment(OWNER);
    });
    schema.sql(
      `update "scheduler"."schedules" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
      { inverse: false },
    );
    schema.refuseNulls("tenant_id", ["schedules"], RESCHEDULE, {
      where: 'nlevel("scope_path") > 3',
    });
    schema.table("schedules", (t: Blueprint) => {
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "platform" });
      t.systemAccess({
        select: ["id", "tenant_id", "job_key", "cron", "time_zone", "misfire", "created_at"],
        reason:
          "the tick claims every tenant's schedules under its lock to work out their due runs",
      });
    });
    schema.systemFunction({
      name: "claim_schedules",
      args: {},
      returns: {
        id: "varchar(33)",
        tenant_id: "varchar(33)",
        job_key: "varchar(200)",
        cron: "varchar(120)",
        time_zone: "varchar(64)",
        misfire: "text",
        created_at: "timestamptz",
      },
      sql: [
        "select s.id, s.tenant_id, s.job_key, s.cron, s.time_zone, s.misfire, s.created_at",
        "from scheduler.schedules as s order by s.id",
      ].join("\n"),
      reason:
        "the tick claims every tenant's schedules under its lock, then loads and pushes each due one in its tenant",
    });
  }
}
