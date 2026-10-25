/**
 * Stackra file contract:
 * Purpose: `refuse`, which builds the typed refusal a peripheral call resolves when no device answers or its
 *          permission is refused (ADR 0250 decision 3), spelled as @stackra/platform's drivers spell it.
 * Boundary: internal; not exported from the entry. Data only: it throws nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0140 (envelope shape).
 */
import type { CapabilityRefusal } from "@stackra/platform/contracts";

/**
 * The failed result of a call to `capability`.
 *
 * @example
 * if (!this.isPresent) return refuse(Capability.Print, "unavailable");
 */
export function refuse(
  capability: string,
  code: CapabilityRefusal["code"],
): { readonly ok: false; readonly error: CapabilityRefusal } {
  return { ok: false, error: { code, capability } };
}
