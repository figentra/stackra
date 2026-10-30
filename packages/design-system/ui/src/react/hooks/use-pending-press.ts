/**
 * Stackra file contract:
 * Purpose: `usePendingPress(action)`, the pending state of a button whose action may return a promise: `isPending`
 *          from the press until the promise settles, and `press`, which refuses a second press meanwhile and resolves
 *          to whether the action succeeded.
 * Boundary: internal, in the shared React layer; the web and native ErrorPage and the ExportDialog import it by path.
 *           A rejection is caught and reported as `false`, never thrown, so the caller decides what the user sees.
 * Runtime: isomorphic
 * Governing contract: ADR 0004 §1 (layer direction); GAPS.md rows 16 and 31 (owner decision 2026-10-28).
 */
import { useEffect, useRef, useState } from "react";

/**
 * The pending state of an action.
 *
 * @example
 * const { isPending, press } = usePendingPress(onRetry);
 * <Button isLoading={isPending} onPress={() => void press()}>{label}</Button>
 */
export function usePendingPress<TArgs extends unknown[]>(
  // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: the action may return nothing when it finishes at once
  action: ((...args: TArgs) => Promise<unknown> | void) | undefined,
): { isPending: boolean; press: (...args: TArgs) => Promise<boolean> } {
  const [isPending, setPending] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const press = async (...args: TArgs): Promise<boolean> => {
    if (busy.current || action === undefined) return false;
    busy.current = true;
    setPending(true);
    try {
      await action(...args);
      return true;
    } catch {
      return false;
    } finally {
      busy.current = false;
      // The action may unmount the button (a retry that recovers the page); no state is set after that.
      if (mounted.current) setPending(false);
    }
  };
  return { isPending, press };
}
