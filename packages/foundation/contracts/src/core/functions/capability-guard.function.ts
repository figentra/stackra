/**
 * Stackra file contract:
 * Purpose: `capabilityGuard`, the one capability-gateway check: from a map of capability code to port interface it
 *          makes the guard that tells whether a gateway lists a capability and narrows it to that capability's port.
 *          Payments (`hasPaymentCapability`) and shipping (`hasCarrierCapability`) are this guard over their maps.
 * Boundary: reads the gateway's own `capabilities` list (its driver's codes); it never probes the provider. The map
 *           is a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); ADR 0369 (decision 2); STA-1383 (one home for the capability-gateway
 *                     pattern).
 */

/**
 * The guard over a capability map `M` (capability code to the interface a gateway with it implements).
 *
 * @example
 * export const hasCarrierCapability = capabilityGuard<CarrierCapabilityGateways>();
 * if (hasCarrierCapability(gateway, CarrierCapability.Pickups)) await gateway.schedulePickup(request);
 */
export function capabilityGuard<M>(): <
  G extends { readonly capabilities: readonly string[] },
  K extends keyof M & string,
>(
  gateway: G,
  capability: K,
) => gateway is G & M[K] {
  return <G extends { readonly capabilities: readonly string[] }, K extends keyof M & string>(
    gateway: G,
    capability: K,
  ): gateway is G & M[K] => gateway.capabilities.includes(capability);
}
