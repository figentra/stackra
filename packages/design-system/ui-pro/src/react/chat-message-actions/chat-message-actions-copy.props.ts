/**
 * Stackra file contract:
 * Purpose: `ChatMessageActionsCopyProps`, props of `Copy`: HeroUI Pro's copy action props, with `aria-label` as
 *          `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatMessageActionsCopyProps as HeroChatMessageActionsCopyProps } from "@heroui-pro/react/chat-message-actions";

import type { ChatMessageActionsPresetContractProps } from "#contracts/types/chat-message-actions-preset-contract-props.type";

/** Props of `Copy`: HeroUI Pro's copy action props, with `aria-label` as `label`. */
export type ChatMessageActionsCopyProps = ChatMessageActionsPresetContractProps &
  Omit<HeroChatMessageActionsCopyProps, keyof ChatMessageActionsPresetContractProps | "aria-label">;
