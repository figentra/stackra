/**
 * Stackra file contract:
 * Purpose: `SecretReloadOptions`, how often `scheduleSecretReload` reloads a store, how long one reload may take and
 *          who hears a failed or timed-out reload.
 * Boundary: a type only. The host that binds a loading store chooses `everySeconds` (0: no interval) and `timeoutMs`;
 *           no config field sets them until STA-2804 binds and schedules the store at boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (decision 4, amendment 2026-11-27, STA-258).
 */

/** The options of `scheduleSecretReload`. */
export type SecretReloadOptions = {
  /** Seconds between reloads, a whole number from 0 to 86400; 0 schedules none, so only `reloadNow` reloads. */
  readonly everySeconds: number;

  /**
   * Told of each failed or timed-out reload with the store's error (or the timeout's), which names steps, statuses or
   * ids, never a value. The store keeps answering from its last good copy. Also told when `onReload` throws. If it
   * throws itself, the error is dropped: `reloadNow` never rejects.
   */
  readonly onError?: ((error: unknown) => void) | undefined;

  /**
   * Milliseconds one reload may take, a whole number from 1 to 600000 (default 30000). A `load()` still unsettled at
   * the deadline is reported to `onError` as timed out, the reload answers false, and the next tick or `reloadNow()`
   * starts a fresh `load()`; the abandoned one is not cancelled.
   */
  readonly timeoutMs?: number | undefined;

  /** Told after each reload that read every secret; if it throws, `onError` is told and the reload still counts. */
  readonly onReload?: (() => void) | undefined;
};
