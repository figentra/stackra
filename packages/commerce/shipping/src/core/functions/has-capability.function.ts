/**
 * Stackra file contract:
 * Purpose: `hasCapability`, whether a carrier gateway declares a capability, narrowing it to that capability's
 *          interface.
 * Boundary: reads the connection's own `capabilities` list; it never calls the carrier.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2).
 */
import type { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import type { CapabilityGateways } from "#contracts/types/capability-gateways.type";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";

/**
 * True when `gateway` lists `capability`.
 *
 * @example
 * if (hasCapability(gateway, CarrierCapability.Pickups)) await gateway.schedulePickup(request);
 */
export function hasCapability<K extends CarrierCapability>(
  gateway: CarrierGateway,
  capability: K,
): gateway is CarrierGateway & CapabilityGateways[K] {
  return gateway.capabilities.includes(capability);
}
