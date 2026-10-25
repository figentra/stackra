/**
 * Stackra file contract:
 * Purpose: unit tests of `IdentityOptions`: its initializers equal the shipped schema's defaults, and the schema is
 *          registered for the class, so validation needs no generated file.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { IDENTITY_CONFIG_SCHEMA } from "#core/constants/identity-config-schema.constant";
import { IdentityOptions } from "#core/schemas/identity-options.schema";

describe("IdentityOptions", () => {
  it("has the shipped schema's defaults as its initializers", () => {
    expect({ ...new IdentityOptions() }).toEqual(IDENTITY_CONFIG_SCHEMA.parse({}));
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(IdentityOptions)).toBe(IDENTITY_CONFIG_SCHEMA);
  });
});
