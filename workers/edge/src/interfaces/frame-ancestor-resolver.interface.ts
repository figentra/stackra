/**
 * Stackra file contract:
 * Purpose: `FrameAncestorResolver`: the port the edge asks for the framers of one request on a path whose
 *          `frameAncestors` entry is `"request"` (Pay's `/c/*`: the checkout session tenant's registered embed origins).
 * Boundary: types only. An implementation answers `undefined` for "none" (an unknown session, a failure, a timeout), so
 *           the edge fails closed to `frame-ancestors 'none'`; the edge validates every origin it answers.
 * Runtime: worker
 * Governing contract: ADR 0437; ADR 0334 rule 12; STA-2562.
 */
import type { HostEntry } from "#src/interfaces/host-entry.interface";

/** Who may frame one request's page. */
export interface FrameAncestorResolver {
  /** The framers of `path` on `host`, or `undefined` for none. */
  readonly resolve: (
    host: HostEntry,
    hostname: string,
    path: string,
  ) => Promise<readonly string[] | undefined>;
}
