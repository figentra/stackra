/**
 * Stackra file contract:
 * Purpose: `PromptInputContractProps`, the props every runtime's `PromptInput` takes: the composer of a chat or agent
 *          screen: a text box that grows with its text, an attachments row, a toolbar of the caller's actions, one
 *          button that sends, waits or stops by `status`, and a footer line.
 * Boundary: types only; sending, stopping and uploading are the app's. The toolbar holds the kit's own parts
 *           (`FileTrigger`, `ModelPicker`, `VoiceInput`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ReactNode } from "react";

import type { PromptInputStatus } from "#contracts/enums/prompt-input-status.enum";

/** Props shared by the web and native `PromptInput`. */
export interface PromptInputContractProps {
  /** The text, for a controlled composer; pair it with `onValueChange`. */
  readonly value?: string | undefined;
  /** The starting text of an uncontrolled composer. */
  readonly defaultValue?: string | undefined;
  /** Called with the text on each change. */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /** Called with the trimmed text on send (the button, or Enter on web); an uncontrolled composer then clears. */
  readonly onSubmit: (value: string) => void;
  /** Called by the button while `streaming`, to stop the reply. */
  readonly onStop?: (() => void) | undefined;
  /** The run state: `ready` (the default), `submitted`, `streaming` or `error`. The text is locked while it runs. */
  readonly status?: PromptInputStatus | undefined;
  /** The hint in the empty box. Defaults to the catalogue's "Ask anything…". */
  readonly placeholder?: string | undefined;
  /** The box's accessible name. Defaults to the catalogue's "Message input". */
  readonly label?: string | undefined;
  /** True to refuse typing and sending. */
  readonly isDisabled?: boolean | undefined;
  /** The files attached so far, usually `AttachmentCard`s, drawn above the text. */
  readonly attachments?: ReactNode;
  /** The toolbar's start group, such as an attach button and a `ModelPicker`. */
  readonly startActions?: ReactNode;
  /** The toolbar's end group, before the send button, such as a `VoiceInput`. */
  readonly endActions?: ReactNode;
  /** A muted line under the composer, such as "Answers can be wrong; check important facts." */
  readonly footer?: ReactNode;
}
