/**
 * Stackra file contract:
 * Purpose: `hasPaymentCapability`, whether a payment gateway declares a capability, narrowing it to that capability's
 *          port: the contracts `capabilityGuard` over `PaymentCapabilityGateways`.
 * Boundary: reads the driver's own `capabilities` list; it never probes the provider. The check itself lives once in
 *           `@stackra/contracts`; this file only binds the payments map.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); STA-1383 (one capability-gateway check; renamed from `hasCapability`).
 */
import { capabilityGuard } from "@stackra/contracts";

import type { PaymentCapabilityGateways } from "#contracts/types/payment-capability-gateways.type";

/**
 * True when `gateway` lists `capability`; narrows it to the capability's port.
 *
 * @example
 * if (hasPaymentCapability(gateway, PaymentCapability.Tokens)) await gateway.charge(request);
 */
export const hasPaymentCapability = capabilityGuard<PaymentCapabilityGateways>();
