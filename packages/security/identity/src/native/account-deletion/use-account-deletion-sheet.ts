/**
 * Stackra file contract:
 * Purpose: `useAccountDeletionSheet`, the mobile app's account deletion section (App Store 5.1.1(v), Google Play):
 *          `useAccountDeletion` with the device's biometric check before `request`.
 * Boundary: data only, no text: the screen renders the words from the `identity.ui.account_deletion` lang keys. A
 *           refused device check sends nothing and answers `false`; the server's step-up still applies (a
 *           `step_up_required` lands in `error`). It reuses the isomorphic hook's file, so both behave alike.
 * Runtime: react-native
 * Governing contract: App Store Review Guideline 5.1.1(v); STA-1567.
 */
import type { AccountDeletionSheetOptions } from "#native/account-deletion/account-deletion-sheet-options.type";
import type { AccountDeletionView } from "#react/account-deletion/account-deletion.type";
import { useAccountDeletion } from "#react/account-deletion/use-account-deletion";

/**
 * The account deletion section's state on a device.
 *
 * @example
 * const deletion = useAccountDeletionSheet({ load, request, cancel, verify: () => authenticateAsync().then((r) => r.success) });
 */
export function useAccountDeletionSheet(options: AccountDeletionSheetOptions): AccountDeletionView {
  const view = useAccountDeletion(options);
  return {
    ...view,
    request: async () => (await options.verify()) && view.request(),
  };
}
