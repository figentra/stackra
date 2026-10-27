/**
 * Stackra file contract:
 * Purpose: `SoftPosReadiness`, whether this phone can take a tap-to-pay card now, and why not when it cannot.
 * Boundary: a type in the leaf entry, answered by a `SoftPos` driver on the device. The reason is the driver's code
 *           (`unsupported_device`, `no_entitlement`, `not_connected`, or the SDK's own), for the staff app to show.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decisions 2 and 5).
 */

/**
 * Tap-to-pay readiness.
 *
 * @example
 * const { ready, reason } = await softPos.readiness();
 */
export interface SoftPosReadiness {
  /** The phone can collect a card now. */
  readonly ready: boolean;

  /** Why not, when `ready` is false. */
  readonly reason?: string;
}
