/**
 * Stackra file contract:
 * Purpose: the Worker entry of `stackra-registry` (ADR 0453): hands each request, with the data centre's cache, to
 *          `serveRegistry`, which builds `RegistryDeps` from the environment and answers it.
 * Boundary: wiring only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 2, 3, 13, 14 and 19); stackra-183 (STA-1335).
 */
import { serveRegistry } from "#src/http/serve-registry";
import type { EdgeCache } from "#src/interfaces/edge-cache.interface";
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";
import type { WorkerContext } from "#src/interfaces/worker-context.interface";

/** The Worker's module handlers: serves the registry API for each request. */
export default {
  async fetch(request: Request, env: RegistryEnv, ctx: WorkerContext): Promise<Response> {
    // The Workers runtime adds `caches.default`, the data centre's cache; the DOM types do not know it.
    const edge = (caches as unknown as { readonly default: EdgeCache }).default;
    return serveRegistry(request, env, ctx, edge);
  },
};
