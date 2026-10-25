/**
 * Stackra file contract:
 * Purpose: `McpServerDefinition`, one server of a `.mcp.yaml`: a local stdio server (`command`, `args`, `env`) or a
 *          remote one (`type: http | sse`, `url`, `headers`).
 * Boundary: type only, derived from `McpConfig`.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 9).
 */
import type { McpConfig } from "#core/types/mcp-config.type";

/** One MCP server definition. */
export type McpServerDefinition = McpConfig["mcpServers"][string];
