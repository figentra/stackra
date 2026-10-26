/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentGroupContractProps`, props of the `ChatAttachmentGroup` root.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatAttachmentGroup` root. */
export interface ChatAttachmentGroupContractProps {
  /** The attachments of one message, in order. */
  readonly children: ReactNode;
}
