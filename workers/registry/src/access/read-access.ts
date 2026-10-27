/**
 * Stackra file contract:
 * Purpose: `readAccess`: the read rule of a scope (or of a name inside it) for one request: `open` ignores tokens,
 *          `licensed` needs a licence whose grants cover the name, `internal` also needs an internal licence, so a
 *          customer grant (`*` included) never reads an internal name.
 * Boundary: decides; reads the licence only through the `LicenceCheck` port. `gate` passes the scope row with a
 *           `name_rules` override already applied.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); ADR 0461 (decision 3).
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
  const refusal =
    scope.read_rule === "internal" && !licence.internal
      ? `${name} is internal`
      : licenceRefusal(licence, scope.scope, name, settings.licenceGraceDays, now);
  return refusal === null
    ? { allowed: true, licence }
    : { allowed: false, status: 403, reason: refusal };
}
