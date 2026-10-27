/**
 * Stackra file contract:
 * Purpose: `handleWhoami`: `GET /-/whoami`: `ci:<repository>` for a publish token, the licence holder for a licence
 *          token.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { bearer } from "#src/access/bearer";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";

/** `GET /-/whoami`: `ci:<repository>` for a publish token, the licence holder for a licence token. */
export async function handleWhoami(deps: RegistryDeps, request: Request): Promise<Response> {
  const token = bearer(request.headers.get("authorization"));
  if (token !== null) {
    const publish = await deps.store.publishToken(await sha256Hex(token), deps.now().toISOString());
    if (publish !== null) return json({ username: `ci:${publish.repository}` });
    const licence = await deps.licences.check(token);
    if (licence !== null) return json({ username: licence.holder });
  }
  return failure(401, "no valid token", {
    "www-authenticate": `Bearer realm="${deps.settings.host}"`,
  });
}
