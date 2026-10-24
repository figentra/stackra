/**
 * Stackra file contract:
 * Purpose: `MCP_PROTOCOL_VERSIONS`, the MCP protocol revisions the local server speaks, newest first. `initialize`
 *          answers with the client's revision when it is listed, otherwise with the newest.
 * Boundary: data only. The server uses tools only, which every listed revision has in the same shape.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5).
 */

/** Supported MCP protocol revisions, newest first. */
export const MCP_PROTOCOL_VERSIONS: readonly string[] = [
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
];
