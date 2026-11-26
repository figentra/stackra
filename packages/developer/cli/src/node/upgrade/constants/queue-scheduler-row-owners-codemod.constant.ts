/**
 * Stackra file contract:
 * Purpose: `QUEUE_SCHEDULER_ROW_OWNERS_CODEMOD`, 0.30.0: `queue.jobs` and `scheduler.schedules` become
 *          tenant-owned; the codemod reports each custom driver.
 * Boundary: data only; the rule is `portWithout`'s (a class extending the port without the named method).
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 98a8940.
 */
import { portWithout } from "#node/upgrade/functions/port-without.function";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** queue.jobs and scheduler.schedules are tenant-owned and their driver ports claim, then load. */
export const QUEUE_SCHEDULER_ROW_OWNERS_CODEMOD: UpgradeCodemod = {
  id: "queue-scheduler-row-owners",
  version: "0.30.0",
  title:
    "queue.jobs and scheduler.schedules are tenant-owned and their driver ports claim, then load",
  note: "Drain the queue before you migrate queue.0003 (let reserved and pending jobs finish or fail, then delete those dead jobs). For scheduler.0002, note each schedule below a tenant node (job, cron, time zone, input, missed-run policy), unschedule it, migrate, then schedule it again from a call in its scope. A custom driver ports: QueueDriver reserve returns JobClaim plus load(id) and claimDead; ScheduleDriver schedules(scope) takes its scope, claim() returns ScheduleClaim plus load(id), and recordFire and forgetFires are new. SchedulerService takes the Container as its last argument. The codemod lists each custom driver.",
  source: "98a8940",
  report: {
    modules: [
      "@stackra/queue",
      "@stackra/queue/contracts",
      "@stackra/scheduler",
      "@stackra/scheduler/contracts",
    ],
    rule: {
      any: [portWithout("QueueDriver", "load"), portWithout("ScheduleDriver", "claim")],
    },
    message:
      "port this driver: QueueDriver reserve answers JobClaim with load(id) and claimDead; ScheduleDriver claim() answers ScheduleClaim with load(id), recordFire and forgetFires",
  },
};
