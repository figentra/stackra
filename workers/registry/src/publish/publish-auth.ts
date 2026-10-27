/**
 * Stackra file contract:
 * Purpose: `publishAuth`: the publish token of a write request, bound to `name`, or the refusal.
 * Boundary: writes through `RegistryStore`, R2 and KV only. No unpublish and no human publish.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 6, 7, 8, 9 and 11); ADR 0013 (immutable versions).
 */
import { bearer } from "#src/access/bearer";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { failure } from "#src/http/failure";
import type { PublishTokenRow } from "#src/interfaces/publish-token-row.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** The publish token of a write request, bound to `name`, or the refusal. */
export async function publishAuth(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<PublishTokenRow | Response> {
  const token = bearer(request.headers.get("authorization"));
  const row =
    token === null
      ? null
      : await deps.store.publishToken(await sha256Hex(token), deps.now().toISOString());
  if (row === null)
    return failure(401, "a publish token from the OIDC exchange is required", {
      "www-authenticate": `Bearer realm="${deps.settings.host}"`,
    });
  if (row.name !== name) return failure(403, `this publish token is for ${row.name}`);
  return row;
}
