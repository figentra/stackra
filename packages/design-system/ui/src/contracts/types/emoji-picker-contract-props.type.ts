/**
 * Stackra file contract:
 * Purpose: the props every runtime's `EmojiPicker` takes: a searchable grid of emoji by category.
 * Boundary: types only; the set is the package's curated one (`EMOJI_SET`).
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */

/** Props shared by the web and native `EmojiPicker`. */
export interface EmojiPickerContractProps {
  /** Called with the emoji picked. */
  readonly onSelect?: ((emoji: string) => void) | undefined;
  /** Emoji shown first under "Recent", newest first. */
  readonly recent?: readonly string[] | undefined;
  /** The spoken name of the grid; defaults to the `ui` catalogue's phrase. */
  readonly label?: string | undefined;
}
