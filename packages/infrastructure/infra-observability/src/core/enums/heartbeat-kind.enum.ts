/**
 * Stackra file contract:
 * Purpose: the kinds of background job that send a heartbeat (ADR 0184 decision 4): crons, outbox relays and queue
 *          workers. Each matches one switch of the root runway's `observability.heartbeats` (`crons`, `relays`,
 *          `workers`).
 * Boundary: an `Enum.of` value plus the type of the same name; `observabilityPlan` keeps a job only when its kind's
 *           switch is on. Codes only.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** What sends the heartbeat. */
export const HeartbeatKind = Enum.of({
  /** A scheduled job (`@stackra/scheduler`): one beat per run. */
  Cron: "cron",
  /** The transactional outbox relay (`@stackra/outbox`): one beat per poll. */
  Relay: "relay",
  /** A queue consumer (`@stackra/queue`): one beat per loop. */
  Worker: "worker",
});

/** One of the codes above. */
export type HeartbeatKind = Enum.Value<typeof HeartbeatKind>;
