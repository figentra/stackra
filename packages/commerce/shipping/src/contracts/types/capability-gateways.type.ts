/**
 * Stackra file contract:
 * Purpose: `CapabilityGateways`, which interface each `CarrierCapability` code stands for.
 * Boundary: a type map in the leaf entry; `hasCapability(gateway, code)` narrows a `CarrierGateway` with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2; open questions 1 and 3).
 */
import type { LabelGateway } from "#contracts/types/label-gateway.type";
import type { PickupGateway } from "#contracts/types/pickup-gateway.type";
import type { PickupPointGateway } from "#contracts/types/pickup-point-gateway.type";
import type { RateGateway } from "#contracts/types/rate-gateway.type";
import type { ReturnLabelGateway } from "#contracts/types/return-label-gateway.type";
import type { TrackingGateway } from "#contracts/types/tracking-gateway.type";

/**
 * Capability code to interface.
 *
 * @example
 * type Labels = CapabilityGateways["labels"]; // LabelGateway
 */
export interface CapabilityGateways {
  /** Live rates. */
  readonly rates: RateGateway;

  /** Labels and their cancel. */
  readonly labels: LabelGateway;

  /** Pickups and their cancel. */
  readonly pickups: PickupGateway;

  /** Tracking events and their map. */
  readonly tracking: TrackingGateway;

  /** Pickup point and locker search. */
  readonly pickup_points: PickupPointGateway;

  /** Return labels and their cancel. */
  readonly returns: ReturnLabelGateway;
}
