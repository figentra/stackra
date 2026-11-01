/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoDraftReview` takes: the text before, Tamo's draft after, the shared task state,
 *          and Accept, Edit and Discard.
 * Boundary: types only; Accept hands back the draft (as edited), Discard leaves the field as it was (ADR 0021).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { TamoStatus } from "#contracts/enums/tamo-status.enum";

/** Props shared by the web and native `TamoDraftReview`. */
export interface TamoDraftReviewContractProps {
  /** The text as it is now; empty for a first draft. */
  readonly before: string;
  /** The text Tamo drafted, shown beside the text as it is now. */
  readonly after: string;
  /** The task's state: `working` shows the shimmer and Stop, `error` the message and Try again. */
  readonly status?: TamoStatus | undefined;
  /** Called with the draft, as edited, to put it in the field. */
  readonly onAccept: (text: string) => void;
  /** Called to drop the draft. */
  readonly onDiscard: () => void;
  /** Stops the task while working. */
  readonly onStop?: (() => void) | undefined;
  /** Runs the task again after an error. */
  readonly onRetry?: (() => void) | undefined;
  /** The heading; defaults to "Tamo's draft". */
  readonly title?: string | undefined;
}
