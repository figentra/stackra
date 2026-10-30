/**
 * Stackra file contract:
 * Purpose: the props every runtime's `PressFeedback` takes: a pressable surface around any content (a card, a tile, a row) that answers a press with a small shrink, a highlight or a ripple, and on native a light haptic.
 * Boundary: types only. It is a button to assistive technology, named by `label` or its content.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

import type { PressFeedbackKind } from "#contracts/enums/press-feedback-kind.enum";

/** Props shared by the web and native `PressFeedback`. */
export interface PressFeedbackContractProps {
  /** What is pressed. */
  readonly children: ReactNode;
  /** Called on a press, by pointer, touch or keyboard. */
  readonly onPress?: (() => void) | undefined;
  /** The accessible name when the content does not say it. */
  readonly label?: string | undefined;
  /** How the press shows. Defaults to `scale`. */
  readonly feedback?: PressFeedbackKind | undefined;
  /** True to refuse presses and drop the feedback. */
  readonly isDisabled?: boolean | undefined;
}
