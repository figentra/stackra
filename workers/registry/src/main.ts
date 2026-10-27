/**
 * Stackra file contract:
 * Purpose: the Worker entry of `stackra-registry` (ADR 0453): builds `RegistryDeps` from the environment (settings
 *          from the vars, the signer from REGISTRY_SIGNING_KEY, the D1 store, the GitHub key set through KV, the
 *          D1 licence check behind the edge cache, the licence API's store) and hands each request to `handleRequest`.
 * Boundary: wiring only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 2, 3, 13, 14 and 19); stackra-183 (STA-1335).
 */
import { cachedLicenceCheck } from "#src/access/cached-licence-check";
import { handleRequest } from "#src/http/handle-request";
import type { EdgeCache } from "#src/interfaces/edge-cache.interface";
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";
import { D1LicenceCheck } from "#src/licence/d1-licence-check";
import { LicenceStore } from "#src/licence/licence-store";
import { jwksSource } from "#src/oidc/jwks-source";
import { readSettings } from "#src/settings/read-settings";
import type { Signer } from "#src/interfaces/signer.interface";
import { createSigner } from "#src/signing/create-signer";
import { RegistryStore } from "#src/store/registry-store";

/** The Worker's execution context. */
interface WorkerContext {
  waitUntil(task: Promise<unknown>): void;
}

/** The signer, imported once per isolate and per key. */
let signer: { readonly pem: string; readonly signer: Promise<Signer> } | null = null;

export default {
  async fetch(request: Request, env: RegistryEnv, ctx: WorkerContext): Promise<Response> {
    const settings = readSettings(env);
    const pem = env.REGISTRY_SIGNING_KEY;
    const current =
      signer?.pem === pem
        ? signer
        : (signer = {
            pem,
            signer: createSigner(pem, settings.signingKeyExpires, settings.retiredKeys),
          });
    // The Workers runtime adds `caches.default`, the data centre's cache; the DOM types do not know it.
    const edge = (caches as unknown as { readonly default: EdgeCache }).default;
    return handleRequest(request, {
      store: new RegistryStore(env.DB),
      tarballs: env.TARBALLS,
      cache: env.CACHE,
      licenceStore: new LicenceStore(env.DB),
      licences: cachedLicenceCheck(new D1LicenceCheck(env.DB), edge, settings.tokenCacheSeconds),
      signer: await current.signer,
      oidcKeys: jwksSource(env.CACHE, fetch, settings.oidcIssuer, settings.oidcKeysSeconds),
      settings,
      now: () => new Date(),
      defer: (task) => ctx.waitUntil(task),
    });
  },
};
