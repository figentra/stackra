/**
 * Stackra file contract:
 * Purpose: the props the web `PressableFeedback` root takes from the shared vocabulary: its content and `isDisabled`.
 * Boundary: types only; web only (HeroUI Pro's PressableFeedback has no native counterpart). Every other prop is
 *          HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ReactNode } from "react";

/** Props of the `PressableFeedback` root. */
export interface PressableFeedbackContractProps {
  /** The pressable's content and its feedback layers (`Highlight`, `Ripple`, `HoldConfirm`, `ProgressFeedback`). */
  readonly children: ReactNode;
  /** Whether the pressable ignores presses and shows no feedback. Enabled when left out. */
  readonly isDisabled?: boolean | undefined;
}
