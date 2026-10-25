/**
 * Stackra file contract:
 * Purpose: `DEVICE_ORDER`, the wire names of per-device order (ADR 0338 decisions 1 and 4): the two headers every
 *          replayed call of the offline queue carries (the device's id and its per-device sequence number) and the
 *          query that answers the device's last acknowledged sequence.
 * Boundary: frozen; names only, spelled once for the client (`ClientMutationSenderDriver`,
 *           `ClientAcknowledgementReaderDriver`) and the server (the generated adapter maps the headers onto the call
 *           the pipeline's apply-order step reads; the server's query locks this key and serves this route). The
 *           sequence is a decimal, strictly increasing per device and not contiguous: a call discarded before it was
 *           sent never takes one. The acknowledged query takes no input: the device is the `deviceHeader` value.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4); ADR 0235 (devices are principals); ADR 0294 (decision 20).
 */

/**
 * The per-device order names.
 *
 * @example
 * headers[DEVICE_ORDER.deviceHeader] = deviceId;
 * headers[DEVICE_ORDER.sequenceHeader] = String(sequence);
 */
export const DEVICE_ORDER = Object.freeze({
  /** The device's id, as `DeviceIdentity.id()` answers it. */
  deviceHeader: "Stackra-Device",
  /** The call's sequence number on its device. */
  sequenceHeader: "Stackra-Device-Sequence",
  /** The locked key of the query that answers the device's last acknowledged sequence. */
  acknowledgedQuery: "devices.device.acknowledged@1",
  /** Its route (`GET`); it answers `{ sequence: number | null }`. */
  acknowledgedPath: "/devices/acknowledged",
});
