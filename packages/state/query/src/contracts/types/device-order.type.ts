/**
 * Stackra file contract:
 * Purpose: `DeviceOrder`, where one replayed call stands in its device's order: the device's id and the call's
 *          per-device sequence number, which `MutationSender.send` puts on the wire (ADR 0338 decision 1).
 * Boundary: a type only. The sequence is strictly increasing per device and not contiguous; it is stamped when the
 *           call is first sent and kept for every resend, so a resend after a lost answer is the same place in the
 *           order. `@stackra/clients` sends both under the `DEVICE_ORDER` header names.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 1); ADR 0294 (decision 8: named types).
 */

/**
 * A call's place in its device's order.
 *
 * @example
 * await sender.send(entry.action, entry.input, entry.id, { deviceId: entry.deviceId, sequence: 1729760400000 });
 */
export interface DeviceOrder {
  /** The device that queued the call (`DeviceIdentity.id()`). */
  readonly deviceId: string;

  /** The call's sequence number on that device. */
  readonly sequence: number;
}
