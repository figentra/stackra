/**
 * Stackra file contract:
 * Purpose: entry of @figentra/worker-turbo-cache, the `stackra-turbo-cache` Worker: hands every request to
 *          `handleTurboCacheRequest` with the bindings wrangler.jsonc declares; every answer names the version that
 *          gave it (`withVersion`, from the CF_VERSION_METADATA binding), the deploy smoke's proof (STA-2786).
 * Boundary: wiring only; the API, auth and settings live in src/cache.
 * Runtime: worker
 * Governing contract: ADR 0026 (decision 1); ADR 0289 (decision 2); ADR 0536.
 */
import { handleTurboCacheRequest } from "#src/cache";
import { withVersion } from "#src/http";
import type { TurboCacheEnv } from "#src/interfaces";

/** The Worker's module handlers: hands each request to the turbo cache API. */
export default {
  fetch: async (request: Request, env: TurboCacheEnv): Promise<Response> =>
    withVersion(await handleTurboCacheRequest(request, env), env.CF_VERSION_METADATA?.id),
};
