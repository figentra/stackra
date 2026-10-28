/**
 * Stackra file contract:
 * Purpose: `RoomSocket`, the server side of one room member's WebSocket as `RealtimeRooms.accept` uses it: send a
 *          text frame, close with an application code, and hear its messages and its close.
 * Boundary: a structural type the runtime's socket (Encore's raw endpoint, a Worker's `WebSocketPair`, `ws`) already
 *           satisfies, so no runtime library is imported.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 5: the client-to-server leg over the socket).
 */

/** An accepted room socket. */
export interface RoomSocket {
  /** Sends one text frame. */
  send: (data: string) => void;

  /** Closes the socket with an application close code (4000 to 4999) and a reason. */
  close: (code?: number, reason?: string) => void;

  /** Calls `listener` with each frame the member sends. */
  addEventListener: ((
    type: "message",
    listener: (event: { readonly data: unknown }) => void,
  ) => void) &
    ((type: "close", listener: () => void) => void);
}
