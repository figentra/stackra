/**
 * Stackra file contract:
 * Purpose: unit tests of `ThemingOptions`: its initializers equal the shipped schema's defaults, it registers that
 *          schema for itself, `ThemingOptions.create` checks values through it, and its constant defaults equal the
 *          `stackra` theme's name and derived background hex.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { STACKRA_THEME } from "@stackra/tokens";
import { Schema, schemaOf } from "@stackra/validation";

import { STACKRA_BACKGROUND } from "#core/constants/stackra-background.constant";
import { THEMING_CONFIG_SCHEMA } from "#core/constants/theming-config-schema.constant";
import { ThemingOptions } from "#core/schemas/theming-options.schema";

describe("ThemingOptions", () => {
  it("is a shape whose initializers equal the shipped defaults", () => {
    const options = new ThemingOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual(THEMING_CONFIG_SCHEMA.parse({}));
  });

  it("keeps its constant defaults equal to the stackra theme", () => {
    const options = new ThemingOptions();
    expect(options.theme).toBe(STACKRA_THEME.name);
    expect(STACKRA_BACKGROUND).toEqual({
      light: STACKRA_THEME.colors.background.hexLight,
      dark: STACKRA_THEME.colors.background.hexDark,
    });
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
