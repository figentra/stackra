/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeScaleConfig`: a configuration over `NativeScaleOptions` keyed `native_scale` (so gen's
 *          selector is `config:native_scale.protocol`), built with its defaults (no address, so no device), a host
 *          override and a runway values layer, and refusing a protocol, transport, UUID or timeout it does not take.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19, 20 and 26); ADR 0478 (decision 5).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { NativeScaleConfig } from "#config/native-scale.config";
import { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";
import type { ScaleTransport } from "#core/types/scale-transport.type";

/** A till's override, under the plain name with the package class aliased. */
const BaseNativeScaleConfig = NativeScaleConfig;

class TillNativeScaleConfig extends BaseNativeScaleConfig {
  override protocol: ScaleProtocolName = ScaleProtocolName.ContinuousAscii;

  override transport: ScaleTransport = "usb";
}

describe("NativeScaleConfig", () => {
  it("is a configuration keyed native_scale, an override inheriting the key", () => {
    expect(new NativeScaleConfig()).toBeInstanceOf(Config);
    expect(configKey(NativeScaleConfig, "native_scale")).toBe("native_scale");
    expect(configKey(TillNativeScaleConfig, "native_scale")).toBe("native_scale");
  });

  it("builds with no scale address", () => {
    const config = buildConfig(NativeScaleConfig);
    expect(config.protocol).toBe("mt_sics");
    expect(config.transport).toBe("ble");
    expect(config.address).toBe("");
    expect(config.baudRate).toBe(9600);
    expect(config.readTimeout).toBe("PT2S");
    expect(config.protocols.mt_sics.request).toBe("SI");
    expect(config.protocols.continuous_ascii.request).toBe("");
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("builds an override and a runway layer", () => {
    const config = buildConfig(TillNativeScaleConfig, {
      values: { address: "0403:6001", baudRate: 2400 },
    });
    expect(config.protocol).toBe("continuous_ascii");
    expect(config.transport).toBe("usb");
    expect(config.address).toBe("0403:6001");
    expect(config.baudRate).toBe(2400);
  });

  it("refuses values it does not take", () => {
    // @ts-expect-error -- "cas" is no protocol this package ships; the runtime refusal is the subject
    expect(() => buildConfig(NativeScaleConfig, { values: { protocol: "cas" } })).toThrow(
      ConfigInvalidError,
    );
    // @ts-expect-error -- "wifi" is no transport; the runtime refusal is the subject
    expect(() => buildConfig(NativeScaleConfig, { values: { transport: "wifi" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(NativeScaleConfig, { values: { bleService: "uart" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(NativeScaleConfig, { values: { readTimeout: Duration.seconds(0) } }),
    ).toThrow(ConfigInvalidError);
  });
});
