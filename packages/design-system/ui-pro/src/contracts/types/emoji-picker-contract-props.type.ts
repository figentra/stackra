/**
 * Stackra file contract:
 * Purpose: the props the web `EmojiPicker` compound takes from the shared vocabulary: the shared `size` and the accessible names of the picker and of its skin-tone trigger and list.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the `EmojiPicker` root that the Stackra vocabulary names. */
export interface EmojiPickerContractProps {
  /** The size of the trigger, popover and emoji; HeroUI Pro's own default when left out. */
  readonly size?: Size | undefined;
  /** The accessible name of the picker, a select; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}

/** Props of `EmojiPicker.SkinToneTrigger` that the Stackra vocabulary names. */
export interface EmojiPickerSkinToneTriggerContractProps {
  /** The accessible name of the skin-tone button; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}

/** Props of `EmojiPicker.SkinToneContent` that the Stackra vocabulary names. */
export interface EmojiPickerSkinToneContentContractProps {
  /** The accessible name of the skin-tone list; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}
