/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PushOptions`: a shape registered with its shipped schema, so validation finds it,
 *          with `provider` typed by the port's driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 4 and 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { PUSH_CONFIG_SCHEMA } from "#core/constants/push-config-schema.constant";
import { PushOptions } from "#core/schemas/push-options.schema";

describe("PushOptions", () => {
  it("is a shape registered with PushConfig$", () => {
    expect(new PushOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(PushOptions)).toBe(PUSH_CONFIG_SCHEMA);
  });

  it("types provider by the PlatformPushTransport driver names", () => {
    expectTypeOf<PushOptions["provider"]>().toEqualTypeOf<
      "memory" | "web" | "expo" | "self_hosted"
    >();
  });
});
