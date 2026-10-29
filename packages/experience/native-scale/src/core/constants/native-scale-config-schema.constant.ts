/**
 * Stackra file contract:
 * Purpose: `NATIVE_SCALE_CONFIG_SCHEMA`, the zod schema this package ships for `NativeScaleConfig` (exported as
 *          `NativeScaleConfig$`): the protocol (the driver gen selects), the transport, the scale's address, the USB
 *          serial speed, the BLE serial service and characteristics, the read timeout and the protocol pack.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults: no address, so no device is touched until a host sets one. The BLE defaults are the
 *           Nordic UART service most BLE serial bridges expose. Nothing here is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0266 (decision 5: config picks the
 *                     driver); ADR 0478 (decision 5).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { SCALE_PROTOCOLS } from "#core/constants/scale-protocols.constant";
import { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";

/** A 128-bit or 16-bit Bluetooth UUID. */
const BLE_UUID = z
  .string()
  .regex(/^(?:[0-9a-f]{4}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);

/** The transports. */
const TRANSPORT = z.enum(["ble", "spp", "usb"]);

/** One protocol pack entry. */
const PROTOCOL = z.object({
  makers: z.array(z.string().min(1)),
  transports: z.array(TRANSPORT).min(1),
  terminator: z.string().min(1).max(2),
  request: z.string(),
  streamStart: z.string(),
  streamStop: z.string(),
  tareQuery: z.string(),
});

/** The protocol pack, one entry per shipped driver. */
const PROTOCOL_PACK = z.object({ mt_sics: PROTOCOL, continuous_ascii: PROTOCOL });

/** An unfrozen copy of one shipped entry, so a parsed config can be changed. */
function copyProtocol(protocol: (typeof SCALE_PROTOCOLS)["mt_sics"]): z.infer<typeof PROTOCOL> {
  return { ...protocol, makers: [...protocol.makers], transports: [...protocol.transports] };
}

/** An unfrozen copy of the shipped pack. */
function protocolDefaults(): z.infer<typeof PROTOCOL_PACK> {
  return {
    mt_sics: copyProtocol(SCALE_PROTOCOLS.mt_sics),
    continuous_ascii: copyProtocol(SCALE_PROTOCOLS.continuous_ascii),
  };
}

// shortcut: authored until gen compiles this package's NativeScaleOptions into #stackra/schemas; replace with STA-339.
/** The shipped `NativeScaleConfig$`. */
export const NATIVE_SCALE_CONFIG_SCHEMA = z.object({
  protocol: z
    .enum([ScaleProtocolName.MtSics, ScaleProtocolName.ContinuousAscii])
    .default(ScaleProtocolName.MtSics),
  transport: TRANSPORT.default("ble"),
  address: z.string().max(64).default(""),
  baudRate: z.int().min(300).max(921_600).default(9600),
  bleService: BLE_UUID.default("6e400001-b5a3-f393-e0a9-e50e24dcca9e"),
  bleNotify: BLE_UUID.default("6e400003-b5a3-f393-e0a9-e50e24dcca9e"),
  bleWrite: BLE_UUID.default("6e400002-b5a3-f393-e0a9-e50e24dcca9e"),
  readTimeout: z
    .custom<Duration>(
      (value) => typeof value === "string" && Duration.toMilliseconds(value as Duration) > 0,
      { message: "Expected an ISO 8601 duration above zero, such as PT2S" },
    )
    .default(Duration.seconds(2)),
  protocols: PROTOCOL_PACK.default(protocolDefaults),
});
