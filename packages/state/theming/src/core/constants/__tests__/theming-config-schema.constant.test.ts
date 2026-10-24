/**
 * Stackra file contract:
 * Purpose: unit tests of `THEMING_CONFIG_SCHEMA`: its defaults come from the `stackra` theme, it offers exactly the
 *          `ColorScheme` values, it checks theme names, asset keys and entries, scheme lists and hex colours, and every
 *          field unwraps to a default a host's generated schema can replace.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { STACKRA_THEME } from "@stackra/tokens";
import { ColorScheme } from "@stackra/ui/contracts";

import { THEMING_CONFIG_SCHEMA } from "#core/constants/theming-config-schema.constant";

const { shape } = THEMING_CONFIG_SCHEMA;

describe("THEMING_CONFIG_SCHEMA", () => {
  it("defaults to the stackra theme", () => {
    const background = {
      light: STACKRA_THEME.colors.background.hexLight,
      dark: STACKRA_THEME.colors.background.hexDark,
    };
    expect(THEMING_CONFIG_SCHEMA.parse({})).toEqual({
      theme: "stackra",
      logo: null,
      schemes: ["light", "dark", "system"],
      defaultScheme: "system",
      themeColor: background,
      splash: { background },
      selfHostedFonts: true,
      tenantOverride: false,
    });
  });

  it("offers exactly the ColorScheme values", () => {
    const values: readonly string[] = Array.isArray(ColorScheme)
      ? ColorScheme
      : Object.values(ColorScheme);
    expect(shape.defaultScheme.unwrap().options).toEqual([...values]);
  });

  it("returns a fresh default scheme list each time", () => {
    const first = THEMING_CONFIG_SCHEMA.parse({});
    first.schemes.pop();
    expect(THEMING_CONFIG_SCHEMA.parse({}).schemes).toHaveLength(3);
  });

  it("accepts an asset key, an asset entry or no logo", () => {
    expect(shape.logo.parse("web::public/logo.svg")).toBe("web::public/logo.svg");
    const entry = {
      key: "web::public/logo.svg",
      file: "assets/public/logo.svg",
      overridable: true,
    };
    expect(shape.logo.parse(entry)).toEqual(entry);
    expect(shape.logo.parse(null)).toBeNull();
    expect(shape.logo.safeParse("public/logo.svg").success).toBe(false);
    expect(
      shape.logo.safeParse({ key: "logo.svg", file: "logo.svg", overridable: true }).success,
    ).toBe(false);
  });

  it("refuses a bad theme name, scheme list or colour", () => {
    expect(shape.theme.safeParse("acme").success).toBe(true);
    expect(shape.theme.safeParse("Acme").success).toBe(false);
    expect(shape.schemes.safeParse(["dark", "light"]).success).toBe(true);
    expect(shape.schemes.safeParse([]).success).toBe(false);
    expect(shape.schemes.safeParse(["dark", "dark"]).success).toBe(false);
    expect(shape.themeColor.safeParse({ light: "#f7f7f5", dark: "#1c1e22cc" }).success).toBe(true);
    expect(shape.themeColor.safeParse({ light: "#fff", dark: "#000000" }).success).toBe(false);
  });

  it("unwraps every field to a replaceable default", () => {
    for (const field of Object.values(shape)) expect(field.unwrap()).toBeDefined();
    expect(shape.defaultScheme.unwrap().default("dark").parse(undefined)).toBe("dark");
  });
});
