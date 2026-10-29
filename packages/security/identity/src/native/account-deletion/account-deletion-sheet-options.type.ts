/**
 * Stackra file contract:
 * Purpose: `AccountDeletionSheetOptions`, what `useAccountDeletionSheet` calls: the `useAccountDeletion` calls plus
 *          `verify`, the device's biometric or passcode check before a deletion is asked.
 * Boundary: a type only. The device check is a confirmation on top of the server's step-up, never instead of it.
 * Runtime: react-native
 * Governing contract: App Store Review Guideline 5.1.1(v); STA-1567.
 */
import type { AccountDeletionOptions } from "#react/account-deletion/account-deletion-options.type";

/** What the hook calls. */
export interface AccountDeletionSheetOptions extends AccountDeletionOptions {
  /** The device's biometric check; `false` sends nothing. */
  readonly verify: () => Promise<boolean>;
}
