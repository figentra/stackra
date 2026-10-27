/**
 * Stackra file contract:
 * Purpose: `handleAttestations`: `GET /-/npm/v1/attestations/@scope%2fname@<version>`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { gate } from "#src/access/gate";
import { failure } from "#src/http/failure";
import { json } from "#src/http/json";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { attestationKey } from "#src/npm/attestation-key";
import { metadataCache } from "#src/npm/metadata-cache";

/** Serves the provenance attestation bundle of one version, `GET /-/npm/v1/attestations/@scope%2fname@<version>`. */
export async function handleAttestations(
  deps: RegistryDeps,
  request: Request,
  name: string,
  versionName: string,
): Promise<Response> {
  const passed = await gate(deps, request, name);
  if (passed instanceof Response) return passed;
  const row = await deps.store.version(name, versionName);
  const object = row === null ? null : await deps.tarballs.get(attestationKey(name, versionName));
  if (row === null || object === null) return failure(404, "not_found");
  const bundle = (await new Response(object.body).json()) as unknown;
  return json({ attestations: [{ predicateType: row.predicate_type, bundle }] }, 200, {
    "cache-control": metadataCache(deps, passed.scope),
  });
}
