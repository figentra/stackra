/**
 * Stackra file contract:
 * Purpose: `HeartbeatSource`, one background job that sends a heartbeat: the service member that runs it, its kind,
 *          its name and how often it beats. The caller (`stackra infra gen`) lists them from the services' manifests:
 *          a cron's period is the interval of its schedule, a relay's and a worker's the interval of their loop.
 * Boundary: type only; an input of `observabilityPlan`.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4).
 */
import type { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";

/** A job that reports it ran. */
export type HeartbeatSource = {
  /** The service member that runs it. */
  readonly service: string;
  /** A cron, an outbox relay or a queue worker. */
  readonly kind: HeartbeatKind;
  /** Unique within the service, kebab-case (`nightly-export`). */
  readonly name: string;
  /** Seconds between two beats; at least 30, Better Stack's shortest period. */
  readonly periodSeconds: number;
};
