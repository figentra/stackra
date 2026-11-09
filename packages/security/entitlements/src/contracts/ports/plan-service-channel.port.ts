/**
 * Stackra file contract:
 * Purpose: the `PlanServiceChannel` port: how `ServicePlanSnapshotsDriver` asks the plan service for the snapshot of
 *          the call's own scope, without this package depending on a client runtime.
 * Boundary: an abstract class that is its own token; one read. `@stackra/clients` ships the driver over the host's
 *           `ClientTransport` (`TransportPlanServiceChannelDriver`).
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 5); ADR 0263 (ports and drivers); ADR 0260 (decision 6).
 */
import { Port } from "@stackra/contracts";
import type { PlanSnapshotWire } from "#contracts/types/plan-snapshot-wire.type";

/**
 * Reads the call scope's plan from the plan service.
 *
 * @example
 * const wire = await channel.snapshot();
 */
export abstract class PlanServiceChannel extends Port {
  /**
   * The plan service's answer for the call's own scope.
   *
   * @throws Error when the plan service cannot be reached or refuses; the reader then fails closed.
   */
  abstract snapshot(): Promise<PlanSnapshotWire>;
}
