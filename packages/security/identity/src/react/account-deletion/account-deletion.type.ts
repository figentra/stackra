/**
 * Stackra file contract:
 * Purpose: `AccountDeletionView`, what `useAccountDeletion` returns: the scheduled
 *          date (null when none), whether a call runs, the last failure, and `refresh`, `request` and `cancel`.
 * Boundary: a type only. No text: the settings screen renders the words from the `identity.ui.account_deletion` lang
 *           keys and formats `dueAt` in the user's locale.
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); STA-1567.
 */
import type { AccountDeletionState } from "#contracts/index";

/** The account deletion section's state. */
export interface AccountDeletionView extends AccountDeletionState {
  /** Whether a load, request or cancel is running. */
  readonly busy: boolean;

  /** The last failure (a `StepUpRequiredError` asks the screen to step up and retry), cleared by the next call. */
  readonly error: unknown;

  /** Loads the state again (on focus). */
  readonly refresh: () => Promise<void>;

  /** Schedules the deletion; `false` when the call failed (see `error`). */
  readonly request: () => Promise<boolean>;

  /** Cancels it; `false` when the call failed. */
  readonly cancel: () => Promise<boolean>;
}
