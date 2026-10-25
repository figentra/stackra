/**
 * Stackra file contract:
 * Purpose: unit and type tests of `LockingOptions`: a shape whose initializer equals the shipped schema's default,
 *          registered with that schema, with `driver` typed as the `LockDriver` driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 4 and
 *                     26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { LOCKING_CONFIG_SCHEMA } from "#core/constants/locking-config-schema.constant";
import { LockingOptions } from "#core/schemas/locking-options.schema";

describe("LockingOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new LockingOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(LockingOptions)).toBe(LOCKING_CONFIG_SCHEMA);
  });

  it("has an initializer equal to the shipped default", () => {
    expect({ ...new LockingOptions() }).toEqual(LOCKING_CONFIG_SCHEMA.parse({}));
  });

  it("types driver as the LockDriver driver names", () => {
    expectTypeOf<LockingOptions["driver"]>().toEqualTypeOf<"postgres" | "valkey" | "memory">();
  });
});
