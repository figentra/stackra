/**
 * Stackra file contract:
 * Purpose: `EmojiPickerProps`, props of the web EmojiPicker: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { EmojiPickerProps as HeroEmojiPickerProps } from "@heroui-pro/react/emoji-picker";

import type { EmojiPickerContractProps } from "#contracts/types/emoji-picker-contract-props.type";

/** Props of the web EmojiPicker: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type EmojiPickerProps = EmojiPickerContractProps &
  Omit<HeroEmojiPickerProps, keyof EmojiPickerContractProps | "aria-label">;
