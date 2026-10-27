/**
 * Stackra file contract:
 * Purpose: `readDistTags`: `GET /-/package/@scope%2fname/dist-tags`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { gate } from "#src/access/gate";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { metadataCache } from "#src/npm/metadata-cache";

/** `GET /-/package/@scope%2fname/dist-tags`. */
export async function readDistTags(
  deps: RegistryDeps,
  request: Request,
  name: string,
): Promise<Response> {
  const passed = await gate(deps, request, name);
  if (passed instanceof Response) return passed;
  if ((await deps.store.package(name)) === null) return failure(404, "not_found");
  return json(await deps.store.distTags(name), 200, {
    "cache-control": metadataCache(deps, passed.scope),
  });
}
