/**
 * Stackra file contract:
 * Purpose: `REALTIME_PATH`, the one path of the realtime endpoint on the realtime origin: a WebSocket upgrade or a
 *          `text/event-stream` GET, each carrying its subscribe token as the `token` query parameter.
 * Boundary: a constant the client transport and the generated raw endpoint share, so the two never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1); HTTP conventions (raw endpoints are a `Controller`, not an action).
 */

/** The realtime endpoint's path. */
export const REALTIME_PATH = "/realtime";
