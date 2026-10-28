/**
 * Stackra file contract:
 * Purpose: `ScaleLink`, what the module opens: the transport, the scale's address on it, the serial speed (USB) and
 *          the Bluetooth LE serial service with its notify and write characteristics.
 * Boundary: a type only; the argument of `NativeScaleModule.connect`, built from `NativeScaleConfig`. The address is
 *           a peripheral identifier (iOS BLE), a MAC address (Android BLE and SPP) or `<vendorId>:<productId>` in hex
 *           (USB), and is not personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5: the module is a pass-through).
 */
import type { ScaleTransport } from "#core/types/scale-transport.type";

/** The link the module opens. */
export interface ScaleLink {
  /** How the scale is reached. */
  readonly transport: ScaleTransport;

  /** The scale's address on that transport. */
  readonly address: string;

  /** The serial speed of a USB link, in baud. */
  readonly baudRate: number;

  /** The BLE serial service UUID. */
  readonly bleService: string;

  /** The BLE characteristic the scale notifies its lines on. */
  readonly bleNotify: string;

  /** The BLE characteristic commands are written to. */
  readonly bleWrite: string;
}
