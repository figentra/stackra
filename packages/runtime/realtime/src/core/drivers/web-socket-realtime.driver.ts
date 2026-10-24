/**
 * Stackra file contract:
 * Purpose: the `websocket` driver of the `RealtimeDriver` port: `accept(socket, url)` joins an upgraded socket, which
 *          then receives each refresh as one JSON text frame; it also answers the SSE fallback (`open(request)`),
 *          inherited from the `sse` driver, for clients whose network blocks sockets.
 * Boundary: takes the socket the generated raw endpoint upgraded (any runtime's WHATWG-shaped socket) and reads
 *           nothing from it. The subscribe token is the `token` query parameter of the upgrade URL; a bad token
 *           closes with 4401, and the token's expiry closes with 4001 so the client reconnects with a fresh one.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: WebSocket with an SSE fallback).
 */
import { SseRealtimeDriver } from "#core/drivers/sse-realtime.driver";
import type { RealtimeSocket } from "#core/types/realtime-socket.type";

/** Close code: the subscribe token was unknown, used or expired. */
const UNAUTHORISED = 4401;

/** Close code: the token's lifetime ended; reconnect with a new one. */
const TOKEN_EXPIRED = 4001;

/**
 * Serves sessions over WebSocket, with the SSE fallback.
 *
 * @example
 * // in the generated raw endpoint, after the runtime upgraded the request
 * driver.accept(socket, request.url);
 */
export class WebSocketRealtimeDriver extends SseRealtimeDriver {
  /**
   * Joins `socket` with the token in `url`, or closes it.
   *
   * @param url - the upgrade request's URL, absolute or path-relative.
   * @returns whether the socket was joined.
   */
  accept(socket: RealtimeSocket, url: string): boolean {
    const token = new URL(url, "http://realtime.invalid").searchParams.get("token") ?? "";
    const leave = this.hub.join(token, {
      deliver: (message) => socket.send(JSON.stringify(message)),
      close: () => socket.close(TOKEN_EXPIRED, "token_expired"),
    });
    if (leave === undefined) {
      socket.close(UNAUTHORISED, "unauthorised");
      return false;
    }
    socket.addEventListener("close", leave);
    return true;
  }
}
