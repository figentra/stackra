/**
 * Stackra file contract:
 * Purpose: `EmojiPickerProps`, the props of the native `EmojiPicker`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { EmojiPickerContractProps } from "#contracts/types/emoji-picker-contract-props.type";

/** Props of the native EmojiPicker. */
export type EmojiPickerProps = EmojiPickerContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
