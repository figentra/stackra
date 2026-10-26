/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentInputContractProps`, props of the `ChatAttachmentInput` root.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatAttachmentInput` root. */
export interface ChatAttachmentInputContractProps {
  /** Whether the picker refuses to open and to take dropped or pasted files; HeroUI Pro's `disabled`. */
  readonly isDisabled?: boolean | undefined;
  /** The trigger and the dropzone, which share the picker. */
  readonly children: ReactNode;
}
