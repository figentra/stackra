/**
 * Stackra file contract:
 * Purpose: `SecretReload`, the handle `scheduleSecretReload` returns: reload now (a rotation signal) or stop the
 *          interval.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (decision 4, amendment 2026-11-27, STA-258).
 */

/** A running reload schedule of one secret store. */
export type SecretReload = {
  /**
   * Reloads the store now; a reload already running is joined, not repeated, until its deadline (`timeoutMs`).
   *
   * @returns true when the store read every secret, false when it failed or timed out (the store keeps its last good
   *          copy and `onError` was told). It never rejects, even when a listener throws.
   */
  reloadNow: () => Promise<boolean>;

  /** Stops the interval; a reload already running finishes. `reloadNow` still works after it. */
  stop: () => void;
};
