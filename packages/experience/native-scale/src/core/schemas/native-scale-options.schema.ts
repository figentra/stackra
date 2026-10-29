/**
 * Stackra file contract:
 * Purpose: `NativeScaleOptions`, the shape of `NativeScaleConfig`: which protocol driver reads the scale, how the
 *          module reaches it (transport, address, USB speed, BLE serial service), how long a read waits, and the
 *          protocol pack (`SCALE_PROTOCOLS` by default).
 * Boundary: a shape class; it registers this package's own schema (`NATIVE_SCALE_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(NativeScaleConfig)` validates with no generated file. The default address
 *           is empty, so a member that never configures a scale touches no hardware: each driver refuses.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0266 (decision 5); ADR 0478 (decision 5); ADR 0253
 *                     (decision 4).
 */
import { Duration } from "@stackra/contracts";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import { NATIVE_SCALE_CONFIG_SCHEMA } from "#core/constants/native-scale-config-schema.constant";
import { SCALE_PROTOCOLS } from "#core/constants/scale-protocols.constant";
import { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";
import { ScaleTransport } from "#core/enums/scale-transport.enum";
import type { ScaleProtocol } from "#core/types/scale-protocol.type";

/**
 * The native scale settings.
 *
 * @example
 * export class NativeScaleConfig extends BaseNativeScaleConfig {
 *   override protocol: ScaleProtocolName = ScaleProtocolName.ContinuousAscii;
 *   override transport: ScaleTransport = ScaleTransport.Usb;
 *   override address = "0403:6001";
 * }
 */
export class NativeScaleOptions extends Schema {
  /** The protocol pack: each protocol's terminator, commands and known makers. */
  // reason: a keyed record of nested settings with no shape class; the package's own shipped schema says it
  @Field(NATIVE_SCALE_CONFIG_SCHEMA.shape.protocols.unwrap())
  protocols: Record<ScaleProtocolName, ScaleProtocol> = SCALE_PROTOCOLS;

  /** The serial speed of a USB link, in baud. */
  @Int({ min: 1 })
  baudRate = 9600;

  /** The scale's protocol, which is also the driver gen selects (`config:native_scale.protocol`). */
  protocol: ScaleProtocolName = ScaleProtocolName.MtSics;

  /** How the module reaches the scale. */
  transport: ScaleTransport = ScaleTransport.Ble;

  /** The scale's address on the transport; empty for no scale. */
  address = "";

  /** The BLE serial service UUID (Nordic UART by default). */
  bleService = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

  /** The BLE characteristic the scale notifies its lines on. */
  bleNotify = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

  /** The BLE characteristic commands are written to. */
  bleWrite = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

  /** How long a read waits for the scale's answer before it refuses. */
  readTimeout: Duration = Duration.seconds(2);
}

registerSchemas([[NativeScaleOptions, NATIVE_SCALE_CONFIG_SCHEMA]]);
