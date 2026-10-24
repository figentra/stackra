/**
 * Stackra file contract:
 * Purpose: `McpProtocolError`, a JSON-RPC error on an MCP connection: thrown by a handler to answer with that code
 *          (`-32601` unknown method, `-32602` invalid params), and raised by `request` when the other end answers
 *          with an error.
 * Boundary: a plain `Error` carrying the JSON-RPC code; never a secret value in the message.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); JSON-RPC 2.0 error codes.
 */

/**
 * A JSON-RPC error.
 *
 * @example
 * throw new McpProtocolError(-32602, "Unknown tool: deploy");
 */
export class McpProtocolError extends Error {
  /** The JSON-RPC error code. */
  readonly code: number;

  /**
   * @param code - the JSON-RPC error code.
   * @param message - what went wrong.
   */
  constructor(code: number, message: string) {
    super(message);
    this.name = "McpProtocolError";
    this.code = code;
  }
}
