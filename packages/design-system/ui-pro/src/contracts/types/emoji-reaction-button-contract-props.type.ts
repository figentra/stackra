/**
 * Stackra file contract:
 * Purpose: the props the web `EmojiReactionButton` takes from the shared vocabulary: its accessible name and size.
 * Boundary: types only; web only (HeroUI Pro's EmojiReactionButton has no native counterpart). `isDisabled`,
 *          `isSelected`, `isReadOnly` and `onPress` already follow the vocabulary in HeroUI Pro and pass through
 *          with every other prop.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of `EmojiReactionButton` that the Stackra vocabulary names. */
export interface EmojiReactionButtonContractProps {
  /** The accessible name of the button, such as "Thumbs up"; HeroUI Pro's `aria-label`, which the emoji alone cannot give. */
  readonly label: string;
  /** The button height and text size. Defaults to `md`. */
  readonly size?: Size | undefined;
}
