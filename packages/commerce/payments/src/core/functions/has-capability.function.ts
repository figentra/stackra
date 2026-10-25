/**
 * Stackra file contract:
 * Purpose: `hasCapability`, whether a gateway declares a capability, narrowing it to that capability's port.
 * Boundary: reads the driver's own `capabilities` list; it never probes the provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */
import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import type { CapabilityGateways } from "#contracts/types/capability-gateways.type";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";

/**
 * True when `gateway` lists `capability`.
 *
 * @example
 * if (hasCapability(gateway, PaymentCapability.Tokens)) await gateway.charge(request);
 */
export function hasCapability<K extends PaymentCapability>(
  gateway: PaymentGateway,
  capability: K,
): gateway is PaymentGateway & CapabilityGateways[K] {
  return gateway.capabilities.includes(capability);
}
