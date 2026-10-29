/**
 * Stackra file contract:
 * Purpose: `useAccountDeletion`, the settings screen's account deletion section (App Store 5.1.1(v), Google Play): it
 *          loads the caller's scheduled deletion on mount, `request` schedules it and `cancel` keeps the account, and
 *          it exposes the date to show.
 * Boundary: data only, no text: the screen renders the words from the `identity.ui.account_deletion` lang keys. The
 *           calls go through the caller's functions (its generated client), because the deletion lives on the
 *           server; the latest functions are read per call, so inline ones load once. A refused request (a
 *           `step_up_required` when the sign-in is too old) lands in `error`; the screen steps up and calls `request`
 *           again. Serves React DOM and React Native alike; `./native`'s `useAccountDeletionSheet` adds the device check.
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0207 (step-up); STA-1567.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { AccountDeletionState } from "#contracts/index";
import type { AccountDeletionView } from "#react/account-deletion/account-deletion.type";
import type { AccountDeletionOptions } from "#react/account-deletion/account-deletion-options.type";

/** Nothing scheduled. */
const NONE: AccountDeletionState = { requestedAt: null, dueAt: null };

/**
 * The account deletion section's state.
 *
 * @example
 * const deletion = useAccountDeletion({ load: api.accountDeletion.read, request: api.accountDeletion.request, cancel: api.accountDeletion.cancel });
 * return deletion.dueAt ? <Button onPress={deletion.cancel}>{t("identity.ui.account_deletion.cancel")}</Button> : …;
 */
export function useAccountDeletion(options: AccountDeletionOptions): AccountDeletionView {
  const calls = useRef(options);
  useEffect(() => {
    calls.current = options;
  });
  const [state, setState] = useState<AccountDeletionState>(NONE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const run = useCallback(async (call: () => Promise<AccountDeletionState>): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      setState(await call());
      return true;
    } catch (failureError) {
      setError(failureError);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await run(() => calls.current.load());
  }, [run]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    busy,
    error,
    refresh,
    request: () => run(() => calls.current.request()),
    cancel: () => run(() => calls.current.cancel()),
  };
}
