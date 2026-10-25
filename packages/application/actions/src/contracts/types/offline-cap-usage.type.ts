/**
 * Stackra file contract:
 * Purpose: `OfflineCapUsage`, how much of an action's offline cap one device has used in the current window: the calls
 *          applied and the amount they carried.
 * Boundary: a type only, what `OfflineCapStore.usage` answers. The amount is in the minor units the cap is written in.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 5: caps per action).
 */

/** A device's use of one action within a window. */
export interface OfflineCapUsage {
  /** The applied calls. */
  readonly count: number;

  /** The sum of their amounts, in minor units. */
  readonly amount: number;
}
