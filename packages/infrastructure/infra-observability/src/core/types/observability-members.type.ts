/**
 * Stackra file contract:
 * Purpose: `ObservabilityMembers`, what `observabilityPlan` needs from the members beside the root runway: each app
 *          member's parsed runway (for `telemetry.sentryProject`), the service member keys (each gets its indicators)
 *          and the jobs that send heartbeats.
 * Boundary: type only; the caller reads the member runways and manifests, this package reads no file.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2: member WHAT, root WHERE), ADR 0184 (decisions 3, 4 and 6).
 */
import type { AppRunway } from "@stackra/runway";

import type { HeartbeatSource } from "#core/types/heartbeat-source.type";

/** The member facts the telemetry plan reads. */
export type ObservabilityMembers = {
  /** App member key to its parsed runway. */
  readonly apps: Readonly<Record<string, AppRunway>>;
  /** The service member keys. */
  readonly services: readonly string[];
  /** The crons, outbox relays and queue workers of those services. */
  readonly heartbeats?: readonly HeartbeatSource[] | undefined;
};
