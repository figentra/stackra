/**
 * Stackra file contract:
 * Purpose: unit tests of `LICENSING_CONFIG_SCHEMA`: its defaults equal `LicensingOptions`' initializers, a loopback
 *          test origin is accepted, and the module registers the schema for the shape class.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { LICENSING_CONFIG_SCHEMA } from "#core/constants/licensing-config-schema.constant";
import { LicensingOptions } from "#core/schemas/licensing-options.schema";

describe("LICENSING_CONFIG_SCHEMA", () => {
  it("defaults to the shape class's initializers", () => {
    expect(LICENSING_CONFIG_SCHEMA.parse({})).toEqual({ ...new LicensingOptions() });
  });

  it("accepts a loopback test origin", () => {
    expect(LICENSING_CONFIG_SCHEMA.safeParse({ apiUrl: "http://127.0.0.1:8080" }).success).toBe(
      true,
    );
  });

  it("is registered for LicensingOptions", () => {
    expect(schemaOf(LicensingOptions)).toBe(LICENSING_CONFIG_SCHEMA);
  });
});
