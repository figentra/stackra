/**
 * Stackra file contract:
 * Purpose: `ChatMessageActionProps`, props of the message action: the shared contract plus HeroUI Pro's button props,
 *          with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatMessageActionProps as HeroChatMessageActionProps } from "@heroui-pro/react/chat-message";

import type { ChatMessageActionContractProps } from "#contracts/types/chat-message-contract-props.type";

/** Props of the message action: the shared contract plus HeroUI Pro's button props, with `aria-label` as `label`. */
export type ChatMessageActionProps = ChatMessageActionContractProps &
  Omit<HeroChatMessageActionProps, keyof ChatMessageActionContractProps | "aria-label">;
