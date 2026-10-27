/**
 * Stackra file contract:
 * Purpose: `handleTarball`: `GET /@scope/name/-/name-<version>.tgz`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { gate } from "#src/access/gate";
import { IMMUTABLE } from "#src/constants/immutable.constant";
import { PRIVATE_NO_STORE } from "#src/constants/private-no-store.constant";
import { failure } from "#src/http/failure";
import { splitName } from "#src/http/split-name";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import { tarballKey } from "#src/npm/tarball-key";

/** `GET /@scope/name/-/name-<version>.tgz`. */
export async function handleTarball(
  deps: RegistryDeps,
  request: Request,
  name: string,
  file: string,
): Promise<Response> {
  const prefix = `${splitName(name).bare}-`;
  if (!file.startsWith(prefix)) return failure(404, "not_found");
  const passed = await gate(deps, request, name);
  if (passed instanceof Response) return passed;
  const versionName = file.slice(prefix.length, -".tgz".length);
  if ((await deps.store.version(name, versionName)) === null) return failure(404, "not_found");
  const object = await deps.tarballs.get(tarballKey(name, versionName));
  if (object === null) return failure(404, "not_found");
  const day = deps.now().toISOString().slice(0, 10);
  deps.defer(deps.store.countDownload(day, name, passed.licence?.licenceId ?? ""));
  return new Response(object.body, {
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(object.size),
      "cache-control": passed.scope.read_rule === "open" ? IMMUTABLE : PRIVATE_NO_STORE,
    },
  });
}
