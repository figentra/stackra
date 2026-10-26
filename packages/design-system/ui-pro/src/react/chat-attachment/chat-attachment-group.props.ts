/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentGroupProps`, props of the web ChatAttachmentGroup: the shared contract plus HeroUI Pro's own
 *          div props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatAttachmentGroupProps as HeroChatAttachmentGroupProps } from "@heroui-pro/react/chat-attachment";

import type { ChatAttachmentGroupContractProps } from "#contracts/types/chat-attachment-group-contract-props.type";

/** Props of the web ChatAttachmentGroup: the shared contract plus HeroUI Pro's own div props, passed through. */
export type ChatAttachmentGroupProps = ChatAttachmentGroupContractProps &
  Omit<HeroChatAttachmentGroupProps, keyof ChatAttachmentGroupContractProps>;
