/**
 * Stackra file contract:
 * Purpose: `UI_RESOURCE_MIME_TYPE`, the media type of an MCP Apps `ui://` resource: a single-file HTML bundle that an
 *          assistant host renders in a sandboxed frame.
 * Boundary: the protocol's value (the MCP Apps extension), not business data.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 2); STA-784.
 */

/** The MIME type of an MCP app UI resource, `text/html;profile=mcp-app`. */
export const UI_RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
