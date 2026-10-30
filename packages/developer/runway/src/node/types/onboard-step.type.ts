/**
 * Stackra file contract:
 * Purpose: `OnboardStep`, one step of mobile onboarding as `onboardMobile` reports it: its key, where it stands, one
 *          line on what was or would be done, and the owner's instructions when it is manual.
 * Boundary: type only; never holds a secret value (names only).
 * Runtime: node
 * Governing contract: ADR 0482 (decisions 1 and 6).
 */
import type { OnboardStepState } from "#core/enums/onboard-step-state.enum";

/** One onboarding step. */
export type OnboardStep = {
  /** `identity`, `eas-project`, `eas-profiles`, `apple-bundle`, `apple-app-record`, `signing`, `push`, `store-keys`, `play-app`. */
  readonly key: string;
  /** Where it stands. */
  readonly state: OnboardStepState;
  /** What was done, would be done, or is missing. */
  readonly detail: string;
  /** The owner's steps, in order, when it is manual. */
  readonly manual?: readonly string[];
};
