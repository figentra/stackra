/**
 * Stackra file contract:
 * Purpose: `handleVersion`: `GET /@scope/name/<version-or-tag>`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { gate } from "#src/access/gate";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { metadataCache } from "#src/npm/metadata-cache";
import { renderManifest } from "#src/npm/render-manifest";

/** Serves the manifest of one version or dist-tag, `GET /@scope/name/<version-or-tag>`. */
export async function handleVersion(
  deps: RegistryDeps,
  request: Request,
  name: string,
  spec: string,
): Promise<Response> {
  const passed = await gate(deps, request, name);
  if (passed instanceof Response) return passed;
  const tags = await deps.store.distTags(name);
  const row = await deps.store.version(name, tags[spec] ?? spec);
  if (row === null) return failure(404, "not_found");
  return json(renderManifest(row, deps.settings.host), 200, {
    "cache-control": metadataCache(deps, passed.scope),
  });
}
