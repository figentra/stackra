/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the two protocol drivers, the configuration with its shape and
 *          shipped schema, and the protocol pack are exported, nothing else is; and the drivers implement
 *          @stackra/peripherals' `Scale` port unchanged.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0478 (decision 5).
 */
import { buildConfig } from "@stackra/config";
import { Scale } from "@stackra/peripherals/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as nativeScale from "#core/index";

describe("@stackra/native-scale", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(nativeScale).sort()).toEqual([
      "ContinuousAsciiScaleDriver",
      "MtSicsScaleDriver",
      "NATIVE_SCALE_CONFIG_SCHEMA",
      "NativeScaleConfig",
      "NativeScaleOptions",
      "SCALE_PROTOCOLS",
      "ScaleProtocolName",
      "ScaleTransport",
    ]);
  });

  it("implements the Scale port", () => {
    const config = buildConfig(nativeScale.NativeScaleConfig);
    expect(new nativeScale.MtSicsScaleDriver(config)).toBeInstanceOf(Scale);
    expect(new nativeScale.ContinuousAsciiScaleDriver(config)).toBeInstanceOf(Scale);
  });
});
