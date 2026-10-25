/**
 * Stackra file contract:
 * Purpose: `openRoom(tokens, room, handlers, options)`, one self-healing WebSocket to a document's room: it asks
 *          `RoomTokens` for a one-time token, connects to `REALTIME_ROOM_PATH` on the token's origin, reports the
 *          `welcome` and every later frame, and reconnects with capped, jittered backoff when the socket closes, until
 *          the caller closes the link.
 * Boundary: web-standard `WebSocket` and `URL` only. Frames that do not parse are dropped. A refused token request is
 *           retried like a dropped socket, so a revoked right stops working at the next connect and never sooner.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 1, 3 and 5); ADR 0225 (decision 1).
 */
import type { RoomFrame } from "@stackra/realtime/contracts";
import { REALTIME_ROOM_PATH } from "@stackra/realtime";

import type { RoomTokens } from "#contracts/ports/room-tokens.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { RoomHandlers } from "#core/types/room-handlers.type";
import type { RoomLink } from "#core/types/room-link.type";

/** The first retry waits about this long. */
const BASE_MS = 500;

/** `WebSocket.OPEN`. */
const OPEN = 1;

/**
 * Opens a room.
 *
 * @throws TypeError (on connect) when the token's origin is empty and there is no page origin.
 * @example
 * const link = openRoom(tokens, { document: page.id }, { onWelcome, onFrame, onDown }, { maxBackoffSeconds: 30 });
 * link.send({ t: "presence", data: {} });
 */
export function openRoom(
  tokens: RoomTokens,
  room: CollaborationRoom,
  handlers: RoomHandlers,
  options: { readonly maxBackoffSeconds: number },
): RoomLink {
  let closed = false;
  let attempt = 0;
  let socket: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const retry = (): void => {
    if (closed) return;
    const cap = Math.min(options.maxBackoffSeconds * 1000, BASE_MS * 2 ** Math.min(attempt, 30));
    attempt += 1;
    timer = setTimeout(() => void connect(), cap / 2 + Math.random() * (cap / 2));
  };

  const connect = async (): Promise<void> => {
    let url: URL;
    try {
      const target = await tokens.issue(room);
      const origin =
        target.origin || (globalThis as { location?: { origin?: string } }).location?.origin;
      if (!origin) throw new TypeError("The room token has no origin and there is no page origin");
      url = new URL(REALTIME_ROOM_PATH, origin);
      url.searchParams.set("token", target.token);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    } catch {
      retry();
      return;
    }
    if (closed) return;
    const current = new WebSocket(url.toString());
    socket = current;
    let welcomed = false;
    current.addEventListener("message", (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      let frame: RoomFrame;
      try {
        frame = JSON.parse(event.data) as RoomFrame;
      } catch {
        return;
      }
      if (frame.t === "welcome") {
        welcomed = true;
        attempt = 0;
        handlers.onWelcome(frame.self);
      } else if (welcomed) handlers.onFrame(frame);
    });
    current.addEventListener("close", () => {
      if (socket === current) socket = undefined;
      if (welcomed) handlers.onDown();
      retry();
    });
  };

  void connect();
  return {
    send: (message) => {
      if (socket?.readyState === OPEN) socket.send(JSON.stringify(message));
    },
    close: () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      socket?.close(1000, "closed");
    },
  };
}
