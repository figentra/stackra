/**
 * Stackra file contract:
 * Purpose: `licenceRefusal`: whether a licence may read `name` of `scope` at `now`.
 * Boundary: decides; reads the licence only through the `LicenceCheck` port.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 10 and 13).
 */
import type { LicenceView } from "#src/interfaces/licence-view.interface";

const DAY_MS = 86_400_000;

/**
 * Whether a licence may read `name` of `scope` at `now`.
 *
 * @returns null when it may, else the refusal reason.
 */
export function licenceRefusal(
  licence: LicenceView,
  scope: string,
  name: string,
  graceDays: number,
  now: Date,
): string | null {
  if (licence.status !== "active") return `licence is ${licence.status}`;
  if (licence.notBefore !== null && Date.parse(licence.notBefore) > now.getTime())
    return "licence is not valid yet";
  if (
    licence.expiresAt !== null &&
    Date.parse(licence.expiresAt) + graceDays * DAY_MS < now.getTime()
  )
    return "licence has expired";
  const covered = licence.grants.some(
    (grant) => grant.scope === scope && (grant.names === "*" || grant.names.includes(name)),
  );
  return covered ? null : `licence has no grant for ${name}`;
}
