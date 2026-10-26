/**
 * Stackra file contract:
 * Purpose: `EmojiPickerSkinToneContentProps`, props of `EmojiPicker.SkinToneContent`: the shared contract plus HeroUI
 *          Pro's own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { EmojiPickerSkinToneContentProps as HeroEmojiPickerSkinToneContentProps } from "@heroui-pro/react/emoji-picker";

import type { EmojiPickerSkinToneContentContractProps } from "#contracts/types/emoji-picker-skin-tone-content-contract-props.type";

/** Props of `EmojiPicker.SkinToneContent`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type EmojiPickerSkinToneContentProps = EmojiPickerSkinToneContentContractProps &
  Omit<
    HeroEmojiPickerSkinToneContentProps,
    keyof EmojiPickerSkinToneContentContractProps | "aria-label"
  >;
