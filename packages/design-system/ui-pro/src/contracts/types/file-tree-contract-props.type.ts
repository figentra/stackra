/**
 * Stackra file contract:
 * Purpose: the props the web `FileTree` takes from the shared vocabulary: its accessible name, its size, and the
 *          two booleans HeroUI Pro spells without `is`.
 * Boundary: types only; web only (HeroUI Pro's FileTree has no native counterpart). Every other prop is HeroUI Pro's
 *          own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of `FileTree` that the Stackra vocabulary names. */
export interface FileTreeContractProps {
  /** The accessible name of the tree, announced by assistive technology; HeroUI Pro's `aria-label`. */
  readonly label: string;
  /** The row height and text size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** Whether the expand and collapse animations are off; HeroUI Pro's `reduceMotion`. Off when left out. */
  readonly isMotionReduced?: boolean | undefined;
}
