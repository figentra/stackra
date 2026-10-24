/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DevicesOptions`: a `Schema` with dev-safe initializers equal to its shipped
 *          schema's defaults, matching that schema's output type exactly, and registered with it when the module loads.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19 and
 *                     26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { DEVICES_CONFIG_SCHEMA } from "#core/constants/devices-config-schema.constant";
import { DevicesOptions } from "#core/schemas/devices-options.schema";

/** The check gen writes for a shape and its schema. */
type DevicesOptions$Check = Assert<
  Same<z.output<typeof DEVICES_CONFIG_SCHEMA>, Fields<DevicesOptions>>
>;

describe("DevicesOptions", () => {
  it("is a Schema whose initializers are the schema's defaults, with no hub URL", () => {
    const options = new DevicesOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(DEVICES_CONFIG_SCHEMA.parse({}));
    expect(options.hubUrl).toBeNull();
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<DevicesOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(DevicesOptions)).toBe(DEVICES_CONFIG_SCHEMA);
  });
});
