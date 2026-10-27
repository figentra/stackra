/**
 * Stackra file contract:
 * Purpose: `FulfilmentCase`, the recorded case every fulfilment-provider (3PL, WMS) driver passes: an order handed over
 *          twice under one reference (the second must return the first fulfilment, not a second shipment), the
 *          fulfilment both must return, then any further steps (status, cancel), with the provider's recorded calls.
 * Boundary: a type only. The repeat hand-over is what `FulfilmentProviderConnector#create` promises; the runner adds
 *           it, so a case cannot leave it out.
 * Runtime: node
 * Governing contract: ADR 0355 (decision 1); ADR 0447 (decision 2); ADR 0443 (decision 8); owner D3 and D4
 *                     2026-10-27; COM-113; STA-793.
 */
import type { Fulfilment, FulfilmentProviderConnector, FulfilmentRequest } from "#contracts/index";
import type { ConnectorCase } from "#testing/connectors/connector-case.type";

/**
 * A recorded fulfilment-provider case.
 *
 * @example
 * const handOver: FulfilmentCase = { name: "hand over", certification: "pending", request, fulfilment, steps: [], exchanges };
 */
export interface FulfilmentCase extends ConnectorCase<FulfilmentProviderConnector> {
  /** The order handed over, both times. */
  readonly request: FulfilmentRequest;

  /** The fulfilment both hand-overs must return. */
  readonly fulfilment: Fulfilment;
}
