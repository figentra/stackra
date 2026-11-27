/**
 * Stackra file contract:
 * Purpose: the script of the `stackra-static` Worker: it answers only `GET /-/version` with the id of the Worker
 *          version that runs (`{ "version": "<id>" }` and the `x-stackra-version` header, from the CF_VERSION_METADATA
 *          binding), so runway's deploy smoke can prove a version override reached the version under test (STA-2786;
 *          the same route as the docs Worker's, STA-2783). Every other request is the static site, served by the
 *          assets layer before the script runs (`run_worker_first` names `/-/version` only); one that reaches the
 *          script anyway is handed to the ASSETS binding, which applies the site's `_headers` and 404 page.
 * Boundary: reads no secret and no request body; never cached (`no-store`). Bundled by wrangler, not by tsdown (whose
 *           entry is the site builder, src/main.ts).
 * Runtime: worker
 * Governing contract: ADR 0284 (hosted static files); ADR 0536; ADR 0352 (decision 3).
 */

/** The bindings the script reads. */
interface StaticEnv {
  /** The static site (wrangler `assets.binding`). */
  readonly ASSETS: { readonly fetch: (request: Request) => Promise<Response> };
  /** The id of the version that runs (wrangler `version_metadata`). */
  readonly CF_VERSION_METADATA?: { readonly id: string };
}

/** The Worker entry: the version route, else the static site. */
export default {
  async fetch(request: Request, env: StaticEnv): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== "/-/version") return env.ASSETS.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    const version = env.CF_VERSION_METADATA?.id ?? "";
    return Response.json(
      { version },
      { headers: { "cache-control": "no-store", "x-stackra-version": version } },
    );
  },
};
