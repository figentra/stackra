/**
 * Stackra file contract:
 * Purpose: `ChatMessageActionsPresetProps`, props of `Regenerate`, `Menu`, `ThumbsUp` and `ThumbsDown`: HeroUI Pro's
 *          action props, with `aria-label` as `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatMessageActionPresetProps as HeroChatMessageActionPresetProps } from "@heroui-pro/react/chat-message-actions";

import type { ChatMessageActionsPresetContractProps } from "#contracts/types/chat-message-actions-preset-contract-props.type";

/** Props of `Regenerate`, `Menu`, `ThumbsUp` and `ThumbsDown`: HeroUI Pro's action props, with `aria-label` as `label`. */
export type ChatMessageActionsPresetProps = ChatMessageActionsPresetContractProps &
  Omit<
    HeroChatMessageActionPresetProps,
    keyof ChatMessageActionsPresetContractProps | "aria-label"
  >;
