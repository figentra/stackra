/**
 * Stackra file contract:
 * Purpose: the Props of the native `DocumentRenderer`: the document the route adapter resolved and the host's handlers
 *          of the verbs its blocks raise (a navigate verb's route key, an action verb).
 * Boundary: a type only. `document` is `unknown` on purpose: a published tree arrives as JSON, and the renderer checks
 *           it before it draws anything.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12: Props in `<name>.props.ts`); ADR 0110 (decisions 3 and 6).
 */
import type { BlockEventHandlers } from "#contracts/types/block-event-handlers.type";

/** What a screen gives the renderer. */
export interface DocumentRendererProps extends BlockEventHandlers {
  /** The document: one node or a list of nodes; `null` or `undefined` draws nothing. */
  readonly document: unknown;
}
