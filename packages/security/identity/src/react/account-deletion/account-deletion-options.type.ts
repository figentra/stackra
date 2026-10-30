/**
 * Stackra file contract:
 * Purpose: `AccountDeletionOptions`, what `useAccountDeletion` calls: `load`, `request` and `cancel`, the app's
 *          generated client for `identity.account_deletion.read@1`, `.request@1` and `.cancel@1`.
 * Boundary: a type only. The server reads the account from the authenticated call; nothing here names one.
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); STA-1567.
 */
import type { AccountDeletionState } from "#contracts/index";

/** What the hook calls. */
export interface AccountDeletionOptions {
  /** The caller's scheduled deletion, or the empty state. */
  readonly load: () => Promise<AccountDeletionState>;

  /** Schedules the caller's deletion; rejects `step_up_required` when the sign-in is too old. */
  readonly request: () => Promise<AccountDeletionState>;

  /** Cancels the pending account deletion. */
  readonly cancel: () => Promise<AccountDeletionState>;
}
