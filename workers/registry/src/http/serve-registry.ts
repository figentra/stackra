/**
 * Stackra file contract:
 * Purpose: `serveRegistry`: builds `RegistryDeps` from the Worker's environment (settings from the vars, the signer
 *          from REGISTRY_SIGNING_KEY, the D1 store, the GitHub key set through KV, the D1 licence check behind the edge
 *          cache, the licence API's store) and hands the request to `handleRequest`. A missing var, a missing or
 *          unreadable signing key fails closed: every route answers 503 `registry_misconfigured`, the health check
 *          included, and the log names the cause without the key.
 * Boundary: wiring only; `handleRequest` owns the routes and their own failures (500 `internal_error`). The signer is
 *           imported once per isolate and per key.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 2, 3, 13, 14 and 19); ADR 0173 (secrets); stackra-183 (STA-1335).
 */
import { cachedLicenceCheck } from "#src/access/cached-licence-check";
import { failure } from "#src/http/failure";
import { handleRequest } from "#src/http/handle-request";
import type { EdgeCache } from "#src/interfaces/edge-cache.interface";
import type { RegistryDeps } from "#src/interfaces/registry-deps.interface";
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";
import type { Signer } from "#src/interfaces/signer.interface";
import type { WorkerContext } from "#src/interfaces/worker-context.interface";
import { D1LicenceCheck } from "#src/licence/d1-licence-check";
import { LicenceStore } from "#src/licence/licence-store";
import { jwksSource } from "#src/oidc/jwks-source";
import { readSettings } from "#src/settings/read-settings";
import { createSigner } from "#src/signing/create-signer";
import { RegistryStore } from "#src/store/registry-store";

/** The signer, imported once per isolate and per key. */
let imported: { readonly pem: string; readonly signer: Promise<Signer> } | undefined;

/** The signing key secret, or a `RangeError` naming it when it is not set. */
function signingKeyOf(env: RegistryEnv): string {
  const pem: unknown = env.REGISTRY_SIGNING_KEY;
  if (typeof pem !== "string" || pem === "")
    throw new RangeError("REGISTRY_SIGNING_KEY is not set");
  return pem;
}

/** The dependencies of one request, built from `env`; throws when the Worker is not configured. */
async function depsOf(
  env: RegistryEnv,
  ctx: WorkerContext,
  edge: EdgeCache,
): Promise<RegistryDeps> {
  const settings = readSettings(env);
  const pem = signingKeyOf(env);
  if (imported?.pem !== pem)
    imported = {
      pem,
      signer: createSigner(pem, settings.signingKeyExpires, settings.retiredKeys),
    };
  return {
    store: new RegistryStore(env.DB),
    tarballs: env.TARBALLS,
    cache: env.CACHE,
    licenceStore: new LicenceStore(env.DB),
    licences: cachedLicenceCheck(new D1LicenceCheck(env.DB), edge, settings.tokenCacheSeconds),
    signer: await imported.signer,
    oidcKeys: jwksSource(env.CACHE, fetch, settings.oidcIssuer, settings.oidcKeysSeconds),
    settings,
    now: () => new Date(),
    defer: (task) => ctx.waitUntil(task),
  };
}

/**
 * The registry's answer to one request in this Worker's environment.
 *
 * @param request - the incoming request.
 * @param env - the bindings, the signing key secret and the vars.
 * @param ctx - the execution context; background work (cache fills) is handed to its `waitUntil`.
 * @param edge - the data centre's cache (`caches.default`).
 * @example
 * export default { fetch: (request, env, ctx) => serveRegistry(request, env, ctx, caches.default) };
 */
export async function serveRegistry(
  request: Request,
  env: RegistryEnv,
  ctx: WorkerContext,
  edge: EdgeCache,
): Promise<Response> {
  let deps: RegistryDeps;
  try {
    deps = await depsOf(env, ctx, edge);
  } catch (error) {
    // The name and message only: no message carries the signing key or a var's value.
    console.error(
      "stackra-registry",
      error instanceof Error ? `${error.name}: ${error.message}` : "unknown error",
    );
    return failure(503, "registry_misconfigured");
  }
  return handleRequest(request, deps);
}
