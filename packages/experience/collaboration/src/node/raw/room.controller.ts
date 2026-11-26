/**
 * Stackra file contract:
 * Purpose: `RoomController`, the raw endpoint of a document room at `REALTIME_ROOM_PATH` (`/realtime/room?token=…`): a
 *          plain GET is served as the room's server-sent-events stream by `RealtimeRooms.stream`, the fallback every
 *          collaboration link takes when its socket cannot open.
 * Boundary: the one-time token in the query is the credential, issued by `collaboration.room.token` after its checks,
 *           so the endpoint takes no session (a raw controller is anonymous to the adapter). A WebSocket upgrade is
 *           answered 426 and leaves the token unused: the Fetch `Request` a generated adapter hands over cannot be
 *           upgraded, so the client falls back to the stream with the same token. A runtime that upgrades sockets calls
 *           `RealtimeRooms.accept(socket, url)` itself.
 * Runtime: node
 * Governing contract: ADR 0346 (decisions 1 and 5); ADR 0225 (decision 1: WebSocket with an SSE fallback); ADR 0294
 *                     (decisions 16 and 25: a raw endpoint is a Controller in `raw/`).
 */
import { Controller } from "@stackra/app/server";
import type { RealtimeRooms } from "@stackra/realtime";

/**
 * Serves a room member's stream.
 *
 * @example
 * // GET /realtime/room?token=… → 200 text/event-stream (401 bad token, 426 upgrade, 429 full room)
 */
// The path is `REALTIME_ROOM_PATH`, written as a literal so gen reads it from the syntax tree.
export class RoomController extends Controller({ path: "/realtime/room" }) {
  /** The room hub of this instance. */
  private readonly rooms: RealtimeRooms;

  /**
   * @param rooms - the room hub of this instance.
   */
  constructor(rooms: RealtimeRooms) {
    super();
    this.rooms = rooms;
  }

  /** Answers the room stream for the token in the request's query. */
  async handle(request: Request): Promise<Response> {
    return this.rooms.stream(request);
  }
}
