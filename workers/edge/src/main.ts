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
import { originFrameAncestorResolver } from "#src/http/origin-frame-ancestor-resolver";
import type { EdgeEnv } from "#src/interfaces/edge-env.interface";
import type { FrameAncestorResolver } from "#src/interfaces/frame-ancestor-resolver.interface";
import { readSettings } from "#src/settings/read-settings";

/** The key source of this isolate, rebuilt only when the issuer or cache time changes. */
let source: { readonly id: string; readonly keys: JsonWebKeys["find"] } | null = null;

/** The frame-ancestor resolver of this isolate, with its cache; rebuilt only when the origin or cache time changes. */
let framers: { readonly id: string; readonly resolver: FrameAncestorResolver } | null = null;

/** The Worker entry: builds `EdgeDeps` from the environment and hands each request to `handleRequest`. */
export default {
  async fetch(request: Request, env: EdgeEnv): Promise<Response> {
    const settings = readSettings(env);
    if (!env.EDGE_SIGNING_SECRET) throw new RangeError("EDGE_SIGNING_SECRET is not set");
    const id = `${settings.issuer} ${settings.keysSeconds}`;
    if (source?.id !== id)
      source = { id, keys: jwksKeySource(settings.issuer, settings.keysSeconds) };
    const base = {
      settings,
      secret: env.EDGE_SIGNING_SECRET,
      keys: source.keys,
      fetcher: fetch,
      now: () => new Date(),
      requestId: () => crypto.randomUUID(),
    };
    const framersId = `${settings.origin} ${settings.frameAncestorsSeconds}`;
    if (framers?.id !== framersId)
      framers = {
        id: framersId,
        resolver: originFrameAncestorResolver(base, settings.frameAncestorsSeconds),
      };
    return handleRequest(request, { ...base, frameAncestors: framers.resolver });
  },
};
