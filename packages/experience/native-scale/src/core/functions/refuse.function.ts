/**
 * Stackra file contract:
 * Purpose: `refuse`, which builds the typed refusal a scale call resolves when no scale answers, its permission is
 *          refused or it reports no weight a till may use (ADR 0250 decision 3), always on capability `serial` as the
 *          `Scale` port documents.
 * Boundary: internal; not exported from the entry. Data only: it throws nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0253; ADR 0478 (decision 5).
 */
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityRefusal } from "@stackra/platform/contracts";

/**
 * The failed result of a scale call.
 *
 * @example
 * if (module === undefined) return refuse("unavailable");
 */
export function refuse(code: CapabilityRefusal["code"]): {
  readonly ok: false;
  readonly error: CapabilityRefusal;
} {
  return { ok: false, error: { code, capability: PlatformCapability.Serial } };
}
