/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentInputTriggerProps`, props of the attach button: the shared contract plus HeroUI Pro's own,
 *          with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatAttachmentInputTriggerProps as HeroChatAttachmentInputTriggerProps } from "@heroui-pro/react/chat-attachment";

import type { ChatAttachmentInputTriggerContractProps } from "#contracts/types/chat-attachment-input-trigger-contract-props.type";

/** Props of the attach button: the shared contract plus HeroUI Pro's own, with `aria-label` as `label`. */
export type ChatAttachmentInputTriggerProps = ChatAttachmentInputTriggerContractProps &
  Omit<
    HeroChatAttachmentInputTriggerProps,
    keyof ChatAttachmentInputTriggerContractProps | "aria-label" | "disabled"
  >;
