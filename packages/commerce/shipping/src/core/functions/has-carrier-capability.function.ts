/**
 * Stackra file contract:
 * Purpose: `hasCarrierCapability`, whether a carrier gateway declares a capability, narrowing it to that capability's
 *          port: the contracts `capabilityGuard` over `CarrierCapabilityGateways`.
 * Boundary: reads the connector's own `capabilities` list; it never calls the carrier. The check itself lives once in
 *           `@stackra/contracts`; this file only binds the shipping map.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); STA-1383 (one capability-gateway check; renamed from `hasCapability`).
 */
import { capabilityGuard } from "@stackra/contracts";

import type { CarrierCapabilityGateways } from "#contracts/types/carrier-capability-gateways.type";

/**
 * True when `gateway` lists `capability`; narrows it to the capability's port.
 *
 * @example
 * if (hasCarrierCapability(gateway, CarrierCapability.Pickups)) await gateway.schedulePickup(request);
 */
export const hasCarrierCapability = capabilityGuard<CarrierCapabilityGateways>();
