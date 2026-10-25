/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RealtimeOptions`: a shape whose initializers equal the shipped schema's defaults,
 *          which registers that schema for itself, and whose field types match the schema's output (the `X$Check`
 *          gen writes).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf, Schema } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { REALTIME_CONFIG_SCHEMA } from "#core/constants/realtime-config-schema.constant";
import { RealtimeOptions } from "#core/schemas/realtime-options.schema";

/** The check gen writes for a shape and its schema. */
type RealtimeOptions$Check = Assert<
  Same<z.output<typeof REALTIME_CONFIG_SCHEMA>, Fields<RealtimeOptions>>
>;

describe("RealtimeOptions", () => {
  it("is a shape whose initializers equal the shipped defaults", () => {
    const options = new RealtimeOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(REALTIME_CONFIG_SCHEMA.parse({}));
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<RealtimeOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(RealtimeOptions)).toBe(REALTIME_CONFIG_SCHEMA);
  });
});
