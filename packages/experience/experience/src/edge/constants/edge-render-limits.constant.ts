/**
 * Stackra file contract:
 * Purpose: `EDGE_RENDER_LIMITS`, the default render budget of one edge render: 32 levels, 2,000 nodes and 512 KiB of
 *          HTML.
 * Boundary: a mechanism safety limit, not a business value; the Worker passes its own through
 *           `EdgeRenderOptions.limits`. A Worker's clock does not move during synchronous work, so the CPU budget is
 *           counted in work (nodes and bytes), never in time.
 * Runtime: isomorphic
 * Governing contract: ADR 0440 (CPU budget and fallback); app-shells-edge-and-extension.md section 16 point 6.
 */

/** The default edge render budget. */
export const EDGE_RENDER_LIMITS = Object.freeze({
  maxDepth: 32,
  maxNodes: 2_000,
  maxBytes: 512 * 1024,
});
