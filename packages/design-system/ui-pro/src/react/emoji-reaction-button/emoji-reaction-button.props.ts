/**
 * Stackra file contract:
 * Purpose: `EmojiReactionButtonProps`, props of the web EmojiReactionButton: the shared contract plus HeroUI Pro's own
 *          toggle props, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { EmojiReactionButtonRootProps } from "@heroui-pro/react/emoji-reaction-button";

import type { EmojiReactionButtonContractProps } from "#contracts/types/emoji-reaction-button-contract-props.type";

/**
 * Props of the web EmojiReactionButton: the shared contract plus HeroUI Pro's own toggle props, with `aria-label`
 * renamed `label`.
 */
export type EmojiReactionButtonProps = EmojiReactionButtonContractProps &
  Omit<EmojiReactionButtonRootProps, keyof EmojiReactionButtonContractProps | "aria-label">;
