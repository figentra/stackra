/**
 * Stackra file contract:
 * Purpose: `DeviceOrder`, the device a call came from: its id and, for a call replayed from the device's offline queue,
 *          the call's per-device sequence number, which the pipeline's apply-order step reads.
 * Boundary: a type only. The generated adapter fills it from the `DEVICE_ORDER` headers of `@stackra/clients` once the
 *           device id matches the verified session's device; this package spells no header name. The sequence is
 *           strictly increasing per device and not contiguous (the client stamps a call when it is first sent). A call
 *           from the device outside its queue (the acknowledged query) carries the id only.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4); ADR 0235 (devices are principals); ADR 0294 (decision 8: named
 *                     types).
 */

/**
 * Where one call stands in its device's order.
 *
 * @example
 * await pipeline.execute(RedeemGiftCardAction, input, { actor, device: { deviceId, sequence: 1729760400000 } });
 */
export interface DeviceOrder {
  /** The verified device's id (`DeviceIdentity.id()` on the client). */
  readonly deviceId: string;

  /** The call's sequence on its device, a whole number from 1; absent for a call outside the device's queue. */
  readonly sequence?: number;
}
