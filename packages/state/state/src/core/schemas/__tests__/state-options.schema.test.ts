/**
 * Stackra file contract:
 * Purpose: unit and type tests of `StateOptions`: a shape whose initializers equal the shipped schema's defaults, typed
 *          fields, and its own schema registered for it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { STATE_CONFIG_SCHEMA } from "#core/constants/state-config-schema.constant";
import { StateOptions } from "#core/schemas/state-options.schema";

describe("StateOptions", () => {
  it("is a shape whose initializers equal the shipped defaults", () => {
    const options = new StateOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(STATE_CONFIG_SCHEMA.parse({}));
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(StateOptions)).toBe(STATE_CONFIG_SCHEMA);
  });

  it("types its fields", () => {
    expectTypeOf<StateOptions["persistStore"]>().toEqualTypeOf<string>();
    expectTypeOf<StateOptions["blockingHydration"]>().toEqualTypeOf<boolean>();
    expectTypeOf<StateOptions["devtoolsInProduction"]>().toEqualTypeOf<boolean>();
  });
});
