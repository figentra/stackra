/**
 * Stackra file contract:
 * Purpose: `UpstreamTool`, one tool an upstream MCP (the local Encore MCP) lists: its name and whatever else it sends
 *          (description, input schema, annotations), proxied unchanged under the `encore_` prefix.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: R-29 (`stackra mcp` proxies the local Encore tools); STA-2873.
 */

/** An upstream tool as listed. */
export type UpstreamTool = {
  /** Its name upstream. */
  readonly name: string;
  /** Its MCP hints, when the upstream sends them. */
  readonly annotations?: { readonly readOnlyHint?: boolean } & Readonly<Record<string, unknown>>;
  /** The rest of its listing. */
  readonly [field: string]: unknown;
};
