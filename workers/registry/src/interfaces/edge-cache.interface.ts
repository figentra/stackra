/**
 * Stackra file contract:
 * Purpose: `EdgeCache`: the data centre's Workers cache (`caches.default`).
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** The data centre's Workers cache (`caches.default`). */
export interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}
