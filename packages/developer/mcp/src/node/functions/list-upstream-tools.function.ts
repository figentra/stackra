/**
 * Stackra file contract:
 * Purpose: `listUpstreamTools(peer)`, every tool an upstream MCP (the local Encore MCP) lists: `tools/list` page after
 *          page, following `nextCursor` until a page has none.
 * Boundary: requests only. Stops at a cursor it has seen or after `MAX_PAGES` pages, so a server that loops cannot
 *           hold `stackra mcp`.
 * Runtime: node
 * Governing contract: R-29 (`stackra mcp` proxies the local Encore tools); the MCP `tools/list` pagination; STA-2873.
 */
import type { McpPeer } from "#node/types/mcp-peer.type";
import type { UpstreamTool } from "#node/types/upstream-tool.type";

/** The most pages read. */
const MAX_PAGES = 100;

/**
 * The upstream tools, across every page.
 *
 * @param peer - the initialized upstream connection.
 * @throws McpProtocolError when the upstream answers a page with an error.
 * @example
 * const tools = await listUpstreamTools(encore);
 */
export async function listUpstreamTools(peer: McpPeer): Promise<UpstreamTool[]> {
  const tools: UpstreamTool[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = (await peer.request("tools/list", cursor === undefined ? {} : { cursor })) as {
      tools?: readonly UpstreamTool[];
      nextCursor?: unknown;
    };
    tools.push(...(result.tools ?? []));
    const next = result.nextCursor;
    if (typeof next !== "string" || next === "" || seen.has(next)) break;
    seen.add(next);
    cursor = next;
  }
  return tools;
}
