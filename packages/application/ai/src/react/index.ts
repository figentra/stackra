/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/ai, the AI module UI kit (`ChatSurface` and its Props)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; the block depends on
 *           @stackra/ui, never the reverse, and never reaches ./node (ADR 0503).
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ChatSurface } from "#react/chat-surface/chat-surface";
export type { ChatSurfaceProps } from "#react/chat-surface/chat-surface.props";
