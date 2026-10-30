/**
 * Stackra file contract:
 * Purpose: `MessageActionsContractProps`, the props every runtime's `MessageActions` takes: the row of actions under an
 *          assistant's message (copy, retry, edit, and a thumbs up or down), each drawn only when it is wired.
 * Boundary: types only; what retry, edit and feedback do is the app's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { MessageFeedback } from "#contracts/enums/message-feedback.enum";

/** Props shared by the web and native `MessageActions`. */
export interface MessageActionsContractProps {
  /** The message's text; set it to offer Copy. */
  readonly copyValue?: string | undefined;
  /** Called with the text once it is on the clipboard. */
  readonly onCopy?: ((value: string) => void) | undefined;
  /** Called when Retry is pressed; set it to offer Retry. */
  readonly onRetry?: (() => void) | undefined;
  /** Called when Edit is pressed; set it to offer Edit. */
  readonly onEdit?: (() => void) | undefined;
  /** The rating given, or null for none; set it to control the thumbs (uncontrolled when left out). */
  readonly feedback?: MessageFeedback | null | undefined;
  /** Called with the new rating, or null when a pressed thumb is pressed again; set it to offer the thumbs. */
  readonly onFeedbackChange?: ((feedback: MessageFeedback | null) => void) | undefined;
  /** The row's accessible name. Defaults to the catalogue's "Message actions". */
  readonly label?: string | undefined;
}
