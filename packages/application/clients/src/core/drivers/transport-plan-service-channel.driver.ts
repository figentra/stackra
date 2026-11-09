/**
 * Stackra file contract:
 * Purpose: `TransportPlanServiceChannelDriver`, `@stackra/entitlements`' `PlanServiceChannel` over the host's
 *          `ClientTransport`: it calls the plan service's `entitlements.effective_set.snapshot.get@1` in the call's own
 *          scope and resolves the decoded answer.
 * Boundary: a read only; a refusal or a `TransportError` propagates, and `ServicePlanSnapshotsDriver` turns it into
 *           no plan (fail closed).
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 5); ADR 0260 (decisions 3 and 6); ADR 0263 (a driver is named by its class).
 */
import { Driver } from "@stackra/container";
import { PlanServiceChannel, type PlanSnapshotWire } from "@stackra/entitlements/contracts";
import type { ClientTransport } from "#contracts/ports/client-transport.port";
import { GET_PLAN_SNAPSHOT_QUERY } from "#core/constants/get-plan-snapshot-query.constant";
import { clientRequest } from "#core/functions/client-request.function";

/**
 * The plan service, reached through the host's transport.
 *
 * @example
 * container.bind(PlanServiceChannel, TransportPlanServiceChannelDriver);
 */
export class TransportPlanServiceChannelDriver extends Driver(PlanServiceChannel) {
  /**
   * @param transport - the host's transport; it carries the call's session and scope.
   */
  constructor(private readonly transport: ClientTransport) {
    super();
  }

  /** The plan service's answer for the call's own scope. */
  async snapshot(): Promise<PlanSnapshotWire> {
    return (await this.transport.send(
      clientRequest(GET_PLAN_SNAPSHOT_QUERY, {}),
    )) as PlanSnapshotWire;
  }
}
