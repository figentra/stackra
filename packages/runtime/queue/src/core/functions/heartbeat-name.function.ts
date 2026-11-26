/**
 * Stackra file contract:
 * Purpose: `heartbeatName`, the heartbeat job name of a background job (ADR 0184 decision 4): its text in lowercase
 *          letters, digits and hyphens, the kebab-case `@stackra/infra-observability` plans a heartbeat under. A queue
 *          worker beats `queue-<queue>` (`heartbeatName("queue-" + queue)`), a cron its Encore CronJob id (the same
 *          formula over its locked key, `cronJobId` of @stackra/gen), the stored schedules' tick `scheduler-schedules`,
 *          and the relays `outbox-relay` and `cross-app-relay`.
 * Boundary: pure; one formula, so the planned heartbeat and the job that beats it agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4); ADR 0294 (decision 20: one formula per identity).
 */

/**
 * The heartbeat job name of `text`.
 *
 * @example
 * heartbeatName("queue-maintenance"); // "queue-maintenance"
 * heartbeatName("queue-Exports_EU"); // "queue-exports-eu"
 */
export function heartbeatName(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}
