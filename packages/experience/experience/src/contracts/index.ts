/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/experience (the `Renderer` port and the document format
 *          it renders: `DocumentNode`, `BlockEvent`, `BlockEventHandlers`, `RenderContext`) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package and
 *           no runtime, so the builder, collaboration and a server read the format from here (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Renderer } from "#contracts/ports/renderer.port";
export type { BlockEvent } from "#contracts/types/block-event.type";
export type { BlockEventHandlers } from "#contracts/types/block-event-handlers.type";
export type { DocumentNode } from "#contracts/types/document-node.type";
export type { RenderContext } from "#contracts/types/render-context.type";
