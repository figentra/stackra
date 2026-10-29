/**
 * Stackra file contract:
 * Purpose: unit and type tests of `NativeScaleOptions`: a shape whose initializers equal the shipped schema's
 *          defaults, with the protocol, transport, timeout and pack fields typed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19 and 26); ADR 0478 (decision 5).
 */
import type { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { NATIVE_SCALE_CONFIG_SCHEMA } from "#core/constants/native-scale-config-schema.constant";
import { NativeScaleOptions } from "#core/schemas/native-scale-options.schema";
import type { ScaleProtocol } from "#core/types/scale-protocol.type";
import type { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";
import type { ScaleTransport } from "#core/types/scale-transport.type";

describe("NativeScaleOptions", () => {
  it("is a shape whose defaults equal the shipped schema's", () => {
    const options = new NativeScaleOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(NATIVE_SCALE_CONFIG_SCHEMA.parse({}));
  });

  it("types each field", () => {
    expectTypeOf<NativeScaleOptions["protocol"]>().toEqualTypeOf<ScaleProtocolName>();
    expectTypeOf<NativeScaleOptions["transport"]>().toEqualTypeOf<ScaleTransport>();
    expectTypeOf<NativeScaleOptions["readTimeout"]>().toEqualTypeOf<Duration>();
    expectTypeOf<NativeScaleOptions["protocols"]>().toEqualTypeOf<
      Record<ScaleProtocolName, ScaleProtocol>
    >();
  });
});
