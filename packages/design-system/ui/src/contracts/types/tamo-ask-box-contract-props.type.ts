/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoAskBox` takes: the "ask in words" box that sends the person's words, shows the
 *          working state, and draws the structured proposal with Apply and Discard.
 * Boundary: types only; the box never applies a proposal by itself (ADR 0021).
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `TamoAskBox`. */
export interface TamoAskBoxContractProps<TProposal> {
  /** Sends the words; resolves with the proposal, or `null` when there is nothing to propose. */
  readonly onAsk: (text: string, signal: AbortSignal) => Promise<TProposal | null>;
  /** Draws the proposal under the box. */
  readonly renderProposal: (proposal: TProposal) => ReactNode;
  /** Called with the proposal when the person applies it. */
  readonly onApply: (proposal: TProposal) => void;
  /** Called when the person discards the proposal. */
  readonly onDiscard?: (() => void) | undefined;
  /** The box's name. Defaults to "Ask Tamo". */
  readonly label?: string | undefined;
  /** The hint inside the empty box. Defaults to "Ask in your own words". */
  readonly placeholder?: string | undefined;
  /** True for a multi-line box (pasted text). */
  readonly isMultiline?: boolean | undefined;
  /** True to put the focus in the box when it mounts (it opened in a popover the person asked for). */
  readonly isAutoFocus?: boolean | undefined;
}
