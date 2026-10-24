/**
 * Stackra file contract:
 * Purpose: `McpPeer`, one end of an MCP stdio connection (newline-delimited JSON-RPC 2.0): send requests and
 *          notifications to the other end, and know when it closed.
 * Boundary: type only; `connectMcp` makes one. The server side answers through the handler given to `connectMcp`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode over stdio); R-29 (proxy the local Encore tools).
 */

/** One end of an MCP stdio connection. */
export type McpPeer = {
  /**
   * Sends a request and resolves with its result.
   *
   * @throws McpProtocolError when the other end answers with an error; Error when the connection closes first.
   */
  readonly request: (method: string, params?: unknown) => Promise<unknown>;
  /** Sends a notification, which has no answer. */
  readonly notify: (method: string, params?: unknown) => void;
  /** Closes both streams and fails every request still waiting. */
  readonly close: () => void;
  /** Settles when the input ends or `close` is called. */
  readonly closed: Promise<void>;
};
