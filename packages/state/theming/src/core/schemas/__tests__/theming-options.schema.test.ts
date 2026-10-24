/**
 * Stackra file contract:
 * Purpose: unit tests of `ThemingOptions`: its initializers equal the shipped schema's defaults, it registers that
 *          schema for itself, and `ThemingOptions.create` checks values through it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { THEMING_CONFIG_SCHEMA } from "#core/constants/theming-config-schema.constant";
import { ThemingOptions } from "#core/schemas/theming-options.schema";

describe("ThemingOptions", () => {
  it("is a shape whose initializers equal the shipped defaults", () => {
    const options = new ThemingOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(THEMING_CONFIG_SCHEMA.parse({}));
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(ThemingOptions)).toBe(THEMING_CONFIG_SCHEMA);
  });

  it("creates checked instances", () => {
    const options = ThemingOptions.create({ ...new ThemingOptions(), theme: "acme" });
    expect(options).toBeInstanceOf(ThemingOptions);
    expect(options.theme).toBe("acme");
    expect(() =>
      ThemingOptions.create({ ...new ThemingOptions(), defaultScheme: "sepia" as never }),
    ).toThrow();
  });
});
