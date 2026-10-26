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
