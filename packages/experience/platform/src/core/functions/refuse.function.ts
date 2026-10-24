/**
 * Stackra file contract:
 * Purpose: `refuse`, which builds the typed refusal a capability call resolves when the target or device cannot honour
 *          it (ADR 0250 decision 3), so every driver spells it the same way.
 * Boundary: internal; not exported from the entry. Data only: it throws nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0140 (envelope shape).
 */
import type { CapabilityRefusal } from "#contracts/types/capability-refusal.type";

/**
 * The failed result of a call to `capability`.
 *
 * @example
 * if (!("Notification" in globalThis)) return refuse(Capability.LocalNotifications, "unavailable");
 */
export function refuse(
  capability: string,
  code: CapabilityRefusal["code"],
): { readonly ok: false; readonly error: CapabilityRefusal } {
  return { ok: false, error: { code, capability } };
}
