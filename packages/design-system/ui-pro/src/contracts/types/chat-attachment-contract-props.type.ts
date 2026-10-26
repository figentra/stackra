/**
 * Stackra file contract:
 * Purpose: the props the web `ChatAttachment`, `ChatAttachmentGroup` and `ChatAttachmentInput` compounds take from
 *          the shared vocabulary: their children, the accessible names of the remove and attach buttons, and the
 *          disabled state of the picker.
 * Boundary: types only; web only. HeroUI Pro's `size` on an attachment is a file size in bytes, not a component
 *          size, so it keeps its name; every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatAttachment` root. */
export interface ChatAttachmentContractProps {
  /** The attachment's parts: preview, icon, info and the remove button. Drawn from the file data when left out. */
  readonly children?: ReactNode | undefined;
}

/** Props of `ChatAttachment.Remove` that the Stackra vocabulary names. */
export interface ChatAttachmentRemoveContractProps {
  /** The accessible name of the remove button; HeroUI Pro's `aria-label`. HeroUI Pro's own name when left out. */
  readonly label?: string | undefined;
}

/** Props of the `ChatAttachmentGroup` root. */
export interface ChatAttachmentGroupContractProps {
  /** The attachments of one message, in order. */
  readonly children: ReactNode;
}

/** Props of the `ChatAttachmentInput` root. */
export interface ChatAttachmentInputContractProps {
  /** Whether the picker refuses to open and to take dropped or pasted files; HeroUI Pro's `disabled`. */
  readonly isDisabled?: boolean | undefined;
  /** The trigger and the dropzone, which share the picker. */
  readonly children: ReactNode;
}

/** Props of `ChatAttachmentInput.Trigger` that the Stackra vocabulary names. */
export interface ChatAttachmentInputTriggerContractProps {
  /** The accessible name of the attach button; HeroUI Pro's `aria-label`; `ui_pro::chat.attach_files` when left out. */
  readonly label?: string | undefined;
  /** Whether the button is disabled; HeroUI Pro's native `disabled`. */
  readonly isDisabled?: boolean | undefined;
}
