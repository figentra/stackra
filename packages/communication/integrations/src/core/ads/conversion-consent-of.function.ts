/**
 * Stackra file contract:
 * Purpose: `conversionConsentOf(conversion, payload)`, the consent an integration event was recorded under when it
 *          grants `marketing` (its snapshot id and granted category codes), else `null`.
 * Boundary: pure and internal (not in a barrel). Missing means refused (ADR 0472 decision 4): no consent at the path,
 *           no snapshot id, no `granted` list, or a list without `marketing` is `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 4); ADR 0298 (decision 1); analytics gap 12 (stackra-412).
 */
import type { Conversion } from "#core/ads/conversion.type";
import { valueAt } from "#core/ads/value-at.function";

/** The `ConsentCategory.Marketing` code of `@stackra/consent`, which gates every ad send. */
const MARKETING = "marketing";

/**
 * The granting consent of `payload`, or `null`.
 *
 * @example
 * conversionConsentOf(PURCHASE, { consent: { snapshotId: "csn_1", granted: ["necessary", "marketing"] } });
 */
export function conversionConsentOf(
  conversion: Conversion,
  payload: unknown,
): { readonly snapshotId: string; readonly granted: readonly string[] } | null {
  const consent = valueAt(payload, conversion.consent ?? "consent");
  if (consent === null || typeof consent !== "object") return null;
  const { snapshotId, granted } = consent as { snapshotId?: unknown; granted?: unknown };
  if (typeof snapshotId !== "string" || snapshotId === "" || !Array.isArray(granted)) return null;
  const codes = granted.filter((code): code is string => typeof code === "string");
  return codes.includes(MARKETING) ? { snapshotId, granted: codes } : null;
}
