/**
 * Stackra file contract:
 * Purpose: `refuse`, which builds the typed refusal a printer call resolves when no printer answers (ADR 0250 decision
 *          3), spelled as @stackra/peripherals' drivers spell it.
 * Boundary: internal; not exported from the entry. Data only: it throws nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0253 (decision 4); ADR 0478 (decision 5).
 */
import type { CapabilityRefusal } from "@stackra/platform/contracts";

/**
 * The failed result of a call to `capability`.
 *
 * @example
 * if (module === undefined) return refuse(PlatformCapability.Print, "unavailable");
 */
export function refuse(
  capability: string,
  code: CapabilityRefusal["code"],
): { readonly ok: false; readonly error: CapabilityRefusal } {
  return { ok: false, error: { code, capability } };
}
