/**
 * Stackra file contract:
 * Purpose: the web `EmojiReactionButton` compound on HeroUI Pro's EmojiReactionButton: the toggle root, which maps
 *          the contract's `label` to `aria-label` and takes the shared `size`, and the parts Emoji and Count.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. `isSelected`, `isReadOnly`,
 *          `isDisabled` and `onPress` are HeroUI Pro's and already follow the vocabulary. The compound exposes the
 *          documented parts: HeroUI Pro's `EmojiReactionButton.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  EmojiReactionButton as HeroEmojiReactionButton,
  type EmojiReactionButtonRootProps,
} from "@heroui-pro/react/emoji-reaction-button";

import type { EmojiReactionButtonContractProps } from "#contracts/types/emoji-reaction-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web EmojiReactionButton: the shared contract plus HeroUI Pro's own toggle props, with `aria-label`
 * renamed `label`.
 */
export type EmojiReactionButtonProps = EmojiReactionButtonContractProps &
  Omit<EmojiReactionButtonRootProps, keyof EmojiReactionButtonContractProps | "aria-label">;

/** The toggle root: HeroUI Pro's, named by `label`. */
function EmojiReactionButtonRoot({ label, size, ...rest }: EmojiReactionButtonProps) {
  return <HeroEmojiReactionButton.Root {...rest} {...omitUndefined({ size })} aria-label={label} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface EmojiReactionButtonParts {
  /** The emoji. */
  readonly Emoji: typeof HeroEmojiReactionButton.Emoji;
  /** The count of people who reacted. */
  readonly Count: typeof HeroEmojiReactionButton.Count;
}

/** A toggle for one emoji reaction: `EmojiReactionButton.Emoji` and `EmojiReactionButton.Count`, named by `label`. */
export const EmojiReactionButton: typeof EmojiReactionButtonRoot & EmojiReactionButtonParts =
  Object.assign(EmojiReactionButtonRoot, {
    Emoji: HeroEmojiReactionButton.Emoji,
    Count: HeroEmojiReactionButton.Count,
  });
