/**
 * Stackra file contract:
 * Purpose: the script of the `stackra-docs` Worker: it answers only `GET /-/version` with the id of the Worker version
 *          that runs (`{ "version": "<id>" }` and the `x-stackra-version` header, from the CF_VERSION_METADATA binding),
 *          so a deploy's smoke can prove a version override reached the version under test (STA-2783, ADR 0536 gate 2).
 *          Every other request is the static site, served by the assets layer before the script runs
 *          (`run_worker_first` names `/-/version` only); one that reaches the script anyway is handed to the ASSETS
 *          binding, which applies the site's 404 page and redirects.
 * Boundary: reads no secret and no request body; never cached (`no-store`).
 * Runtime: worker
 * Governing contract: ADR 0514 (the docs Worker); ADR 0536.
 */

/** The bindings the script reads. */
interface DocsEnv {
  /** The static site (wrangler `assets.binding`). */
  readonly ASSETS: { readonly fetch: (request: Request) => Promise<Response> };
  /** The id of the version that runs (wrangler `version_metadata`). */
  readonly CF_VERSION_METADATA?: { readonly id: string };
}

/** The Worker entry: the version route, else the static site. */
export default {
  async fetch(request: Request, env: DocsEnv): Promise<Response> {
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
