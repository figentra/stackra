/**
 * Stackra file contract:
 * Purpose: `EmojiPickerSkinToneTriggerProps`, props of `EmojiPicker.SkinToneTrigger`: the shared contract plus HeroUI
 *          Pro's own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { EmojiPickerSkinToneTriggerProps as HeroEmojiPickerSkinToneTriggerProps } from "@heroui-pro/react/emoji-picker";

import type { EmojiPickerSkinToneTriggerContractProps } from "#contracts/types/emoji-picker-skin-tone-trigger-contract-props.type";

/** Props of `EmojiPicker.SkinToneTrigger`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type EmojiPickerSkinToneTriggerProps = EmojiPickerSkinToneTriggerContractProps &
  Omit<
    HeroEmojiPickerSkinToneTriggerProps,
    keyof EmojiPickerSkinToneTriggerContractProps | "aria-label"
  >;
