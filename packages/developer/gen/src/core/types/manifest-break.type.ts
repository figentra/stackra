/**
 * Stackra file contract:
 * Purpose: `ManifestBreak`, one way a new manifest breaks the contract of the last released one: a removed action,
 *          event, permission, extension point or refusal code, a narrowed input, a widened output, or a version change
 *          dropped before its sunset.
 * Boundary: a type only. A break needs a dated change, a new event version or a new key; a rename needs `@Renamed`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 22); ADR 0158; ADR 0131 (deprecation and sunset); ADR 0260.
 */

/** One backward-incompatible change. */
export interface ManifestBreak {
  /** The manifest section: `actions`, `events`, `permissions`, `errors`, `extensionPoints` or `schemas`. */
  readonly section: string;

  /** The identity it concerns (`orders.order.cancel@1`, `orders.order.paid.v1`, `order_not_payable`). */
  readonly identity: string;

  /** What changed, with the JSON path inside a shape when the break is in one. */
  readonly message: string;
}
