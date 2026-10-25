/**
 * Stackra file contract:
 * Purpose: `RenderContext`, what a `Renderer` needs besides the document: the locale each `LocalizedText` is read in
 *          and the host's handlers of the verbs the blocks raise.
 * Boundary: a type only, in the leaf entry. The locale is a BCP 47 tag; the text falls back from the exact tag to its
 *           language, then to the first locale the text holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 3); ADR 0112; ADR 0305 (lang conventions: BCP 47 case).
 */
import type { BlockEventHandlers } from "#contracts/types/block-event-handlers.type";

/**
 * The context of one render.
 *
 * @example
 * renderer.render(document, { locale: "ar-SA", onNavigate: (route) => open(route) });
 */
export interface RenderContext extends BlockEventHandlers {
  /** The visitor's locale (`ar-SA`). */
  readonly locale: string;
}
