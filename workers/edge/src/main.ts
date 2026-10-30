/**
 * Stackra file contract:
 * Purpose: the Worker entry of `stackra-edge` (ADR 0437): builds `EdgeDeps` from the environment (settings from the
 *          vars, the signing secret from EDGE_SIGNING_SECRET, the issuer's keys through `jwksKeySource` cached in the
 *          isolate) and hands each request to `handleRequest`.
 * Boundary: wiring only. One key source per isolate and issuer, so the key set is fetched once per cache time.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 1, 2 and 4); ADR 0206 (decision 8).
 */
import { jwksKeySource } from "@stackra/app";
import type { JsonWebKeys } from "@stackra/app/contracts";

import { handleRequest } from "#src/http/handle-request";
import type { EdgeEnv } from "#src/interfaces/edge-env.interface";
import { readSettings } from "#src/settings/read-settings";

/** The key source of this isolate, rebuilt only when the issuer or cache time changes. */
let source: { readonly id: string; readonly keys: JsonWebKeys["find"] } | null = null;

/** The Worker entry: builds `EdgeDeps` from the environment and hands each request to `handleRequest`. */
export default {
  async fetch(request: Request, env: EdgeEnv): Promise<Response> {
    const settings = readSettings(env);
    if (!env.EDGE_SIGNING_SECRET) throw new RangeError("EDGE_SIGNING_SECRET is not set");
    const id = `${settings.issuer} ${settings.keysSeconds}`;
    if (source?.id !== id)
      source = { id, keys: jwksKeySource(settings.issuer, settings.keysSeconds) };
    return handleRequest(request, {
      settings,
      secret: env.EDGE_SIGNING_SECRET,
      keys: source.keys,
      fetcher: fetch,
      now: () => new Date(),
      requestId: () => crypto.randomUUID(),
    });
  },
};
