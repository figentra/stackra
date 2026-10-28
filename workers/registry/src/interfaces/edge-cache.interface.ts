/**
 * Stackra file contract:
 * Purpose: `EdgeCache`: the data centre's Workers cache (`caches.default`).
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** The data centre's Workers cache (`caches.default`). */
export interface EdgeCache {
  /** Resolves to the cached response for the request, or undefined on a miss. */
  match: (request: Request) => Promise<Response | undefined>;
  /** Stores a response for the request in this data centre's cache. */
  put: (request: Request, response: Response) => Promise<void>;
}
