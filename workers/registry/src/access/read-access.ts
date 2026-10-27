/**
 * Stackra file contract:
 * Purpose: `readAccess`: the read rule of a scope for one request.
 * Boundary: decides; reads the licence only through the `LicenceCheck` port.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13).
 */
import { bearer } from "#src/access/bearer";
import type { LicenceCheck } from "#src/access/licence-check.port";
import { licenceRefusal } from "#src/access/licence-refusal";
import type { ReadAccess } from "#src/interfaces/read-access.type";
import type { RegistrySettings } from "#src/interfaces/registry-settings.interface";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";

/**
 * The read rule of a scope for one request.
 *
 * @example
 * await readAccess(scopeRow, "@stackra-pro/sync", request.headers.get("authorization"), licences, settings, now);
 */
export async function readAccess(
  scope: ScopeRow,
  name: string,
  authorization: string | null,
  licences: LicenceCheck,
  settings: RegistrySettings,
  now: Date,
): Promise<ReadAccess> {
  if (scope.read_rule === "open") return { allowed: true, licence: null };
  const token = bearer(authorization);
  if (token === null)
    return { allowed: false, status: 401, reason: `${scope.scope} needs a licence token` };
  const licence = await licences.check(token);
  if (licence === null)
    return { allowed: false, status: 401, reason: "licence token is not valid" };
  const refusal = licenceRefusal(licence, scope.scope, name, settings.licenceGraceDays, now);
  return refusal === null
    ? { allowed: true, licence }
    : { allowed: false, status: 403, reason: refusal };
}
