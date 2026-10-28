/**
 * Stackra file contract:
 * Purpose: `cronJobId`, the Encore CronJob id of a cron action: its locked key in lowercase letters, digits and
 *          hyphens (`billing.invoice.send_reminders@1` is `billing-invoice-send-reminders-1`). `encoreCronJobs()` of
 *          @stackra/scheduler calls this same function at run time, so the emitted CronJobs and the dispatch agree.
 * Boundary: pure. The id of the stored schedules' minute tick is `SCHEDULES_CRON_JOB_ID`, never a key's.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 6); ADR 0266 (decision 4.6); ADR 0294 (decision 20: one formula per
 *                     identity).
 */

/**
 * The CronJob id of a locked action key.
 *
 * @example
 * cronJobId("billing.invoice.send_reminders@1"); // "billing-invoice-send-reminders-1"
 */
export function cronJobId(key: string): string {
  return key
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}
