/**
 * Stackra file contract:
 * Purpose: `McpHandler`, what answers the requests and notifications the other end of an MCP connection sends: the
 *          resolved value is the JSON-RPC result, and a thrown `McpProtocolError` its error code.
 * Boundary: type only; `connectMcp` calls it.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5).
 */

/** Answers one incoming request or notification. */
export type McpHandler = (method: string, params: unknown) => Promise<unknown>;
