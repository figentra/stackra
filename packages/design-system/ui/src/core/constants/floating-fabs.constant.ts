/**
 * Stackra file contract:
 * Purpose: `FLOATING_FABS`, how many floating Fabs (any placement but `inline`) are on screen, as an external store:
 *          each floating Fab registers while mounted, and the ToastProvider reads the count to lift a bottom toast
 *          stack clear of the Fab on a phone-width layout (web) or a phone (native).
 * Boundary: module state shared by every React root of the app (web and native); `register` returns its own release, so a Fab that
 *           mounts twice (Strict Mode) or unmounts leaves the count right.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); owner approval 2026-10-29 (STA-1371, FAB toast).
 */

/** The floating-Fab count and its subscription, for `useSyncExternalStore`. */
export const FLOATING_FABS = (() => {
  let count = 0;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  return {
    /** Subscribes to changes of the count; returns the unsubscribe. */
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** The count now. */
    count: (): number => count,
    /** Counts one more floating Fab; returns its release, which counts it once only. */
    register(): () => void {
      count += 1;
      emit();
      let isReleased = false;
      return () => {
        if (isReleased) return;
        isReleased = true;
        count -= 1;
        emit();
      };
    },
  };
})();
