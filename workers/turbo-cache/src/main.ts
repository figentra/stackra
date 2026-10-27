/**
 * Stackra file contract:
 * Purpose: entry of @figentra/worker-turbo-cache, the `stackra-turbo-cache` Worker: hands every request to
 *          `handleTurboCacheRequest` with the bindings wrangler.jsonc declares.
 * Boundary: wiring only; the API, auth and settings live in src/cache.
 * Runtime: worker
 * Governing contract: ADR 0026 (decision 1); ADR 0289 (decision 2).
 */
import { handleTurboCacheRequest } from "#src/cache";
import type { TurboCacheEnv } from "#src/interfaces";

export default {
  fetch: (request: Request, env: TurboCacheEnv): Promise<Response> =>
    handleTurboCacheRequest(request, env),
};
