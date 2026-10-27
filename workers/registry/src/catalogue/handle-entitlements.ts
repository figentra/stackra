/**
 * Stackra file contract:
 * Purpose: `handleEntitlements`: `GET /-/stackra/v1/entitlements`: what a licence token may read.
 * Boundary: metadata only, to anyone, for the `open` and `licensed` scopes; never a tarball or file contents beyond
 *           the `stackra` field. `internal` scopes are not listed.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11, 12 and 13).
 */
import { bearer } from "#src/access/bearer";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** `GET /-/stackra/v1/entitlements`: what a licence token may read. */
export async function handleEntitlements(deps: RegistryDeps, request: Request): Promise<Response> {
  const token = bearer(request.headers.get("authorization"));
  const licence = token === null ? null : await deps.licences.check(token);
  if (licence === null)
    return failure(401, "a licence token is required", {
      "www-authenticate": `Bearer realm="${deps.settings.host}"`,
    });
  return json({
    holder: licence.holder,
    grants: licence.grants,
    expiresAt: licence.expiresAt,
    status: licence.status,
  });
}
