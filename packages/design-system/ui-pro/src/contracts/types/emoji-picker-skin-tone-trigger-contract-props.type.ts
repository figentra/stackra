/**
 * Stackra file contract:
 * Purpose: `EmojiPickerSkinToneTriggerContractProps`, props of `EmojiPicker.SkinToneTrigger` that the Stackra
 *          vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `EmojiPicker.SkinToneTrigger` that the Stackra vocabulary names. */
export interface EmojiPickerSkinToneTriggerContractProps {
  /** The accessible name of the skin-tone button; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}
