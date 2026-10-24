/**
 * Stackra file contract:
 * Purpose: `renderMcpJson(config)`, the exact text of the gitignored `.mcp.json` Claude Code reads, rendered from a
 *          checked `.mcp.yaml`: two-space JSON with a final newline, servers in file order.
 * Boundary: text only; writing and the drift check are `syncMcpConfig` and `checkMcpConfig` (`./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 10: `.mcp.json` is rendered from `.mcp.yaml`).
 */
import type { McpConfig } from "#core/types/mcp-config.type";

/**
 * The `.mcp.json` text for `config`.
 *
 * @param config - a document `parseMcpConfig` returned; its shape is already Claude Code's.
 * @example
 * renderMcpJson({ mcpServers: { linear: { type: "http", url: "https://mcp.linear.app/mcp" } } });
 */
export function renderMcpJson(config: McpConfig): string {
  return `${JSON.stringify({ mcpServers: config.mcpServers }, null, 2)}\n`;
}
