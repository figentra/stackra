/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentProps`, props of the web ChatAttachment: the shared contract plus HeroUI Pro's own chip
 *          props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatAttachmentProps as HeroChatAttachmentProps } from "@heroui-pro/react/chat-attachment";

import type { ChatAttachmentContractProps } from "#contracts/types/chat-attachment-contract-props.type";

/** Props of the web ChatAttachment: the shared contract plus HeroUI Pro's own chip props, passed through. */
export type ChatAttachmentProps = ChatAttachmentContractProps &
  Omit<HeroChatAttachmentProps, keyof ChatAttachmentContractProps>;
