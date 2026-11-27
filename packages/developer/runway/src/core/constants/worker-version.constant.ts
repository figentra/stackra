/**
 * Stackra file contract:
 * Purpose: `WORKER_VERSION`, the names a Worker deploy's version proof shares between the Worker and its smoke: the
 *          response header every Stackra Worker names its running version in (its `CF_VERSION_METADATA` binding's id),
 *          the route a Worker whose answers are static assets serves it at (`{ "version": "<id>" }`), and Cloudflare's
 *          request header that routes one request to one version of the current deployment. The CI driver
 *          (`CloudflareWorkersProviderDriver`) reads them, and the box deploy's smoke (tools/scripts/worker-smoke.mjs,
 *          STA-2783) uses the same names.
 * Boundary: data only. Cloudflare honours the override only for a version that is part of the current deployment; for
 *           any other it routes the request normally, which is why the proof exists (STA-2786).
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3); ADR 0536 (gate 2, the version proof); STA-2786.
 */

/** The version proof's names. */
export const WORKER_VERSION = Object.freeze({
  /** The response header naming the Worker version that answered. */
  header: "x-stackra-version",
  /** The route that answers `{ "version": "<id>" }` (and the header) on a Worker whose answers are static assets. */
  route: "/-/version",
  /** Cloudflare's request header that routes a request to one version of the current deployment. */
  override: "Cloudflare-Workers-Version-Overrides",
} as const);
