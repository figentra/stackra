/**
 * Stackra file contract:
 * Purpose: `ChatConversationProps`, props of the web ChatConversation: the shared contract plus HeroUI Pro's own div
 *          props, with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatConversationProps as HeroChatConversationProps } from "@heroui-pro/react/chat-conversation";

import type { ChatConversationContractProps } from "#contracts/types/chat-conversation-contract-props.type";

/** Props of the web ChatConversation: the shared contract plus HeroUI Pro's own div props, with `aria-label` as `label`. */
export type ChatConversationProps = ChatConversationContractProps &
  Omit<HeroChatConversationProps, keyof ChatConversationContractProps | "aria-label">;
