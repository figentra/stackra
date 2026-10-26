/**
 * Stackra file contract:
 * Purpose: `ChatMessageActionsProps`, props of the web ChatMessageActions: the shared contract plus HeroUI Pro's own
 *          div props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatMessageActionsProps as HeroChatMessageActionsProps } from "@heroui-pro/react/chat-message-actions";

import type { ChatMessageActionsContractProps } from "#contracts/types/chat-message-actions-contract-props.type";

/** Props of the web ChatMessageActions: the shared contract plus HeroUI Pro's own div props, passed through. */
export type ChatMessageActionsProps = ChatMessageActionsContractProps &
  Omit<HeroChatMessageActionsProps, keyof ChatMessageActionsContractProps>;
