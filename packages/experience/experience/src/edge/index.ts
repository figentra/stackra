/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./edge` entry of @stackra/experience (the edge render of a published document to HTML,
 *          `renderEdgeDocument`, its default budget `EDGE_RENDER_LIMITS`, its failure codes `EdgeRenderFailure`, the
 *          `escapeHtml` every edge block writes props through, and the types `EdgeBlock`, `EdgeBlockContext`,
 *          `EdgeRenderOptions` and `EdgeRenderResult`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. No React, no Node API: the OS edge Worker imports only this
 *           entry (ADR 0440).
 * Runtime: worker
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0440.
 */
export { EDGE_RENDER_LIMITS } from "#edge/constants/edge-render-limits.constant";
export { EdgeRenderFailure } from "#edge/enums/edge-render-failure.enum";
export { escapeHtml } from "@stackra/support";
export { renderEdgeDocument } from "#edge/functions/render-edge-document.function";
export type { EdgeBlock } from "#edge/types/edge-block.type";
export type { EdgeBlockContext } from "#edge/types/edge-block-context.type";
export type { EdgeRenderOptions } from "#edge/types/edge-render-options.type";
export type { EdgeRenderResult } from "#edge/types/edge-render-result.type";
