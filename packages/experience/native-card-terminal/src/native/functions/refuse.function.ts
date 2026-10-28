/**
 * Stackra file contract:
 * Purpose: `refuse`, the typed refusal a card terminal call resolves when no reader answers or a permission is refused
 *          (ADR 0250 decision 3), spelled as @stackra/peripherals' drivers spell it.
 * Boundary: internal; not exported from the entry. Data only: it throws nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0253 (decision 4).
 */
import type { CapabilityRefusal } from "@stackra/platform/contracts";

/**
 * The failed result of a call to `capability`.
 *
 * @example
 * return refuse(PlatformCapability.CardTerminal, "unavailable");
 */
export function refuse(
  capability: string,
  code: CapabilityRefusal["code"],
): { readonly ok: false; readonly error: CapabilityRefusal } {
  return { ok: false, error: { code, capability } };
}
