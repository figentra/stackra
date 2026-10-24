/**
 * Stackra file contract:
 * Purpose: `RealtimeSocket`, the server-side socket `WebSocketRealtimeDriver.accept` takes: the part of the WHATWG
 *          `WebSocket` interface it uses, which the runtimes' upgraded sockets (Node `ws`, Workers, Deno, Bun) share.
 * Boundary: a structural type, so the driver imports no socket library; the generated raw endpoint upgrades the
 *           request and hands the socket over. The driver only sends text and closes; it reads nothing from the client.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: WebSocket); ADR 0124 (Encore is generated, not imported).
 */

/** An upgraded server socket. */
export interface RealtimeSocket {
  /** Sends one text frame. */
  send(data: string): void;

  /** Closes the socket with an application close code (4000 to 4999) and a reason. */
  close(code?: number, reason?: string): void;

  /** Calls `listener` once the socket has closed, whichever side closed it. */
  addEventListener(type: "close", listener: () => void): void;
}
