/**
 * Stackra file contract:
 * Purpose: `openRoom(tokens, room, handlers, options)`, one self-healing link to a document's room: it asks `RoomTokens`
 *          for a one-time token, connects a WebSocket to `REALTIME_ROOM_PATH` on the token's origin, reports the
 *          `welcome` and every later frame, and reconnects with capped, jittered backoff when the link drops, until the
 *          caller closes it. When the socket closes before it ever opened (a proxy or network that blocks WebSockets),
 *          the link falls back to a server-sent-events stream of the same path for the rest of its life, and sends
 *          through `RoomTokens.publish` (the `collaboration.room.publish` action) with the welcome's publish key.
 * Boundary: web-standard `WebSocket`, `fetch` and `URL` only. Frames that do not parse are dropped. A refused token
 *           request is retried like a dropped link, so a revoked right stops working at the next connect and never
 *           sooner. On the stream a send is fire-and-forget: a publish the host cannot make, or that is refused, is
 *           dropped as a send on a closed socket is.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 1, 3 and 5); ADR 0225 (decision 1: WebSocket with an SSE fallback); owner
 *                     D10 2026-10-28 (stackra-223: the contracts `backoffDelay`, `maxBackoff` as a `Duration`).
 */
import { backoffDelay, Duration, Jitter } from "@stackra/contracts";
import { REALTIME_ROOM_PATH } from "@stackra/realtime";
import type { RoomFrame } from "@stackra/realtime/contracts";
import { readServerSentEvents } from "@stackra/transport";

import type { RoomTokens } from "#contracts/ports/room-tokens.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { RoomHandlers } from "#core/types/room-handlers.type";
import type { RoomLink } from "#core/types/room-link.type";

/** The reconnect wait before stackra-223 moved the formula to @stackra/contracts: 500 ms doubling, equal jitter. */
const RECONNECT = Object.freeze({ base: Duration.parse("500ms"), jitter: Jitter.Equal });

/** `WebSocket.OPEN`. */
const OPEN = 1;

/**
 * Opens a room.
 *
 * @throws TypeError (on connect) when the token's origin is empty and there is no page origin.
 * @example
 * const link = openRoom(tokens, { document: page.id }, { onWelcome, onFrame, onDown }, { maxBackoff: Duration.seconds(30) });
 * link.send({ t: "presence", data: {} });
 */
export function openRoom(
  tokens: RoomTokens,
  room: CollaborationRoom,
  handlers: RoomHandlers,
  options: { readonly maxBackoff: Duration },
): RoomLink {
  let closed = false;
  let attempt = 0;
  let streaming = false;
  let socket: WebSocket | undefined;
  let stream: AbortController | undefined;
  let key: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const retry = (): void => {
    if (closed) return;
    attempt += 1;
    timer = setTimeout(
      () => void connect(),
      backoffDelay({ ...RECONNECT, max: options.maxBackoff }, attempt),
    );
  };

  /** Reports one frame's text; answers whether the link is now welcomed. */
  const receive = (text: string, welcomed: boolean): boolean => {
    let frame: RoomFrame;
    try {
      frame = JSON.parse(text) as RoomFrame;
    } catch {
      return welcomed;
    }
    if (frame.t === "welcome") {
      attempt = 0;
      key = frame.key;
      handlers.onWelcome(frame.self);
      return true;
    }
    if (welcomed) handlers.onFrame(frame);
    return welcomed;
  };

  /** Reads the room's event stream at `url` until it ends, then reconnects. */
  const read = async (url: URL): Promise<void> => {
    const abort = new AbortController();
    stream = abort;
    let welcomed = false;
    try {
      const response = await fetch(url.toString(), {
        headers: { accept: "text/event-stream" },
        signal: abort.signal,
      });
      if (response.ok)
        for await (const event of readServerSentEvents(response)) {
          if (closed) return;
          if (event.event === "frame") welcomed = receive(event.data, welcomed);
        }
    } catch {
      // A refused, aborted or broken stream ends the link below.
    }
    if (stream === abort) stream = undefined;
    key = undefined;
    if (welcomed) handlers.onDown();
    retry();
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
    } catch {
      retry();
      return;
    }
    if (closed) return;
    if (streaming) {
      await read(url);
      return;
    }
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const current = new WebSocket(url.toString());
    socket = current;
    let opened = false;
    let welcomed = false;
    current.addEventListener("open", () => {
      opened = true;
    });
    current.addEventListener("message", (event: MessageEvent) => {
      if (typeof event.data === "string") welcomed = receive(event.data, welcomed);
    });
    current.addEventListener("close", () => {
      if (socket === current) socket = undefined;
      if (welcomed) handlers.onDown();
      if (!opened && !closed) {
        // The socket never opened: WebSockets are blocked here, so this link streams from now on.
        streaming = true;
        void connect();
        return;
      }
      retry();
    });
  };

  void connect();
  return {
    send: (message) => {
      if (socket?.readyState === OPEN) socket.send(JSON.stringify(message));
      else if (stream !== undefined && key !== undefined)
        void tokens.publish(room, key, message).catch(() => undefined);
    },
    close: () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      socket?.close(1000, "closed");
      stream?.abort();
    },
  };
}
