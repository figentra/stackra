/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentRemoveProps`, props of the remove button: the shared contract plus HeroUI Pro's close button
 *          props, with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatAttachmentRemoveProps as HeroChatAttachmentRemoveProps } from "@heroui-pro/react/chat-attachment";

import type { ChatAttachmentRemoveContractProps } from "#contracts/types/chat-attachment-remove-contract-props.type";

/** Props of the remove button: the shared contract plus HeroUI Pro's close button props, with `aria-label` as `label`. */
export type ChatAttachmentRemoveProps = ChatAttachmentRemoveContractProps &
  Omit<HeroChatAttachmentRemoveProps, keyof ChatAttachmentRemoveContractProps | "aria-label">;
