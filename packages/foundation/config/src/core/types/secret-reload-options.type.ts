/**
 * Stackra file contract:
 * Purpose: `SecretReloadOptions`, how often `scheduleSecretReload` reloads a store and who hears a failed reload.
 * Boundary: a type only. The host that binds a loading store chooses `everySeconds` (0: no interval); no config field
 *           sets it until STA-2804 binds and schedules the store at boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (decision 4, amendment 2026-11-27, STA-258).
 */

/** The options of `scheduleSecretReload`. */
export type SecretReloadOptions = {
  /** Seconds between reloads, a whole number from 0 to 86400; 0 schedules none, so only `reloadNow` reloads. */
  readonly everySeconds: number;

  /**
   * Told of each failed reload with the store's error, which names steps, statuses or ids, never a value. The store
   * keeps answering from its last good copy.
   */
  readonly onError?: ((error: unknown) => void) | undefined;

  /** Told after each reload that read every secret. */
  readonly onReload?: (() => void) | undefined;
};
