/**
 * Stackra file contract:
 * Purpose: `ScaleTransport`, how the module reaches the scale: `ble` (a Bluetooth LE serial bridge, iOS and Android),
 *          `spp` (Bluetooth Classic serial port profile, Android) or `usb` (a USB serial adapter, Android).
 * Boundary: an `Enum.of`, so gen reads the transport field as an enum shape type; snake_case wire values the config,
 *           the module and the config plugin share. iOS answers only `ble` (no USB serial or SPP without an MFi
 *           accessory); the module refuses the others there.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0253 (decision 3).
 */
import { Enum } from "@stackra/contracts";

/** The transports the module speaks. */
export const ScaleTransport = Enum.of({
  /** A Bluetooth LE serial bridge (iOS and Android). */
  Ble: "ble",
  /** Bluetooth Classic serial port profile (Android). */
  Spp: "spp",
  /** A USB serial adapter (Android). */
  Usb: "usb",
});

/** One of the transports above. */
export type ScaleTransport = Enum.Value<typeof ScaleTransport>;
