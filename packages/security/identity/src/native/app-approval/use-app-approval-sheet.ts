/**
 * Stackra file contract:
 * Purpose: `useAppApprovalSheet`, the mobile app's approve sheet: the principal's pending app approvals with the
 *          requester's device, IP, coarse location and user agent, the numbers to pick from, and `approve` (after the
 *          device's biometric check) and `deny`; `scan` redeems a QR token into the sheet.
 * Boundary: data only, no text: the sheet renders the words from the app's lang keys. The calls go through the
 *           caller's functions (its generated client for `AppApprovalService.pending`, `.approve`, `.deny` and
 *           `.redeem`; the server reads the principal and the bound device from the call). The biometric check is the
 *           caller's `verify` (Expo LocalAuthentication in the app); a refused check sends nothing. Every answer
 *           reloads the list. The latest functions are read per call, so inline ones load the list once on mount.
 * Runtime: react-native
 * Governing contract: STA-1304 (owner request 2026-10-27); ADR 0294 (decision 17).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { AppApprovalPrompt } from "#core/index";
import type { AppApprovalSheet } from "#native/app-approval/app-approval-sheet.type";
import type { AppApprovalSheetOptions } from "#native/app-approval/app-approval-sheet-options.type";

/**
 * The approve sheet's state.
 *
 * @example
 * const sheet = useAppApprovalSheet({ load, approve, deny, redeem, verify: () => authenticateAsync().then((r) => r.success) });
 * sheet.prompts[0]?.choices.map((n) => <Button key={n} onPress={() => sheet.approve(sheet.prompts[0]!.id, n)}>{n}</Button>);
 */
export function useAppApprovalSheet(options: AppApprovalSheetOptions): AppApprovalSheet {
  // The latest calls, so inline functions each render neither reload the list nor go stale.
  const calls = useRef(options);
  useEffect(() => {
    calls.current = options;
  });
  const [prompts, setPrompts] = useState<readonly AppApprovalPrompt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const run = useCallback(async <T>(work: () => Promise<T>, fallback: T): Promise<T> => {
    setBusy(true);
    setError(undefined);
    try {
      return await work();
    } catch (failureError) {
      setError(failureError);
      return fallback;
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(
    () => run(async () => setPrompts(await calls.current.load()), undefined),
    [run],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    prompts,
    busy,
    error,
    refresh,
    approve: (id, number) =>
      run(async () => {
        if (!(await calls.current.verify())) return false;
        const approved = await calls.current.approve(id, number);
        setPrompts(await calls.current.load());
        return approved;
      }, false),
    deny: (id) =>
      run(async () => {
        await calls.current.deny(id);
        setPrompts(await calls.current.load());
      }, undefined),
    scan: (qrToken) =>
      run(async () => {
        const prompt = await calls.current.redeem(qrToken);
        setPrompts((current) => [prompt, ...current.filter((other) => other.id !== prompt.id)]);
      }, undefined),
  };
}
