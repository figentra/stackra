/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentInputProps`, props of the web ChatAttachmentInput: the shared contract plus HeroUI Pro's
 *          own, with `disabled` as `isDisabled`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatAttachmentInputProps as HeroChatAttachmentInputProps } from "@heroui-pro/react/chat-attachment";

import type { ChatAttachmentInputContractProps } from "#contracts/types/chat-attachment-input-contract-props.type";

/** Props of the web ChatAttachmentInput: the shared contract plus HeroUI Pro's own, with `disabled` as `isDisabled`. */
export type ChatAttachmentInputProps = ChatAttachmentInputContractProps &
  Omit<HeroChatAttachmentInputProps, keyof ChatAttachmentInputContractProps | "disabled">;
