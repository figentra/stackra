/**
 * Stackra file contract:
 * Purpose: `OfflineStatus`, how far a unit is behind on submission: records waiting, the oldest one's time, the
 *          deadline the pack's reporting window sets, and whether that deadline has passed.
 * Boundary: a type only; `FiscalService.offlineStatus` answers it. The till stops new sales at the lower of the
 *           tenant's offline limit and this deadline; the tenant limit is a setting, not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 3); ADR 0363 (decision 4).
 */

/** One unit's submission backlog. */
export type OfflineStatus = {
  /** Records still `sealed`. */
  readonly pending: number;
  /** When the oldest of them was sealed; `null` when none waits. */
  readonly oldestSealedAt: Date | null;
  /** When the oldest must be submitted; `null` when none waits or the pack sets no window. */
  readonly deadline: Date | null;
  /** Whether the deadline has passed. */
  readonly overdue: boolean;
};
