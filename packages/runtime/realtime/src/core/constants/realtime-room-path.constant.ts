/**
 * Stackra file contract:
 * Purpose: `REALTIME_ROOM_PATH`, the path a room member's WebSocket connects to (`/realtime/room?token=…`), beside the
 *          refresh channel's `REALTIME_PATH`.
 * Boundary: a constant only. Gen mounts the raw endpoint that calls `RealtimeRooms.accept` at this path; the
 *           collaboration drivers build their socket URL from it, so the two never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 1 and 5).
 */

/** The room socket's path. */
export const REALTIME_ROOM_PATH = "/realtime/room";
