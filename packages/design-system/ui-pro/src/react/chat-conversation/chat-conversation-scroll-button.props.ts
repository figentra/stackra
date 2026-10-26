/**
 * Stackra file contract:
 * Purpose: `ChatConversationScrollButtonProps`, props of the scroll button: the shared contract plus HeroUI Pro's
 *          button props, with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatConversationScrollButtonProps as HeroChatConversationScrollButtonProps } from "@heroui-pro/react/chat-conversation";

import type { ChatConversationScrollButtonContractProps } from "#contracts/types/chat-conversation-scroll-button-contract-props.type";

/** Props of the scroll button: the shared contract plus HeroUI Pro's button props, with `aria-label` as `label`. */
export type ChatConversationScrollButtonProps = ChatConversationScrollButtonContractProps &
  Omit<
    HeroChatConversationScrollButtonProps,
    keyof ChatConversationScrollButtonContractProps | "aria-label"
  >;
