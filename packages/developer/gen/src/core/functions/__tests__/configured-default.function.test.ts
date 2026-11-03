/**
 * Stackra file contract:
 * Purpose: unit tests of `configuredDefault`: the field default a host's override of a package config class sets,
 *          matched by the class name and the package or a subpath of it; the base default for an unset field, a
 *          value of another type, another package's class of the same name, a non-config shape or no override at
 *          all; undefined when there is no base default either.
 * Boundary: test only; builds on `COMMERCE_IR`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 1); STA-2065.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { configuredDefault } from "#core/functions/configured-default.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** A host override of `I18nConfig` from `from` setting `locales` to `value`. */
const override = (
  from: string,
  kind: ShapeIR["kind"] = "config",
  value: unknown = ["en", "ar-SA"],
): ShapeIR => ({
  name: "I18nConfig",
  kind,
  module: "commerce",
  file: "src/config/i18n.config.ts",
  importPath: "#config/i18n.config",
  base: { kind: "package", name: "I18nConfig", from },
  fields: [
    {
      name: "locales",
      optional: false,
      nullable: false,
      type: { kind: "json" },
      rules: [],
      default: { value, code: JSON.stringify(value), imports: [] },
    },
  ],
  relations: [],
});

/** The member with `shapes` in place of its own. */
const withShapes = (shapes: ShapeIR[]): MemberIR => ({ ...COMMERCE_IR, shapes });

describe("configuredDefault", () => {
  it("reads the field default the override sets", () => {
    const ir = withShapes([override("@stackra/i18n")]);
    expect(configuredDefault(ir, "I18nConfig", "@stackra/i18n", "locales")).toEqual([
      "en",
      "ar-SA",
    ]);
  });

  it("matches a base imported from a subpath of the package", () => {
    const ir = withShapes([override("@stackra/i18n/contracts")]);
    expect(configuredDefault(ir, "I18nConfig", "@stackra/i18n", "locales")).toEqual([
      "en",
      "ar-SA",
    ]);
  });

  it("takes the base default for a field the override leaves out", () => {
    const ir = withShapes([override("@stackra/i18n")]);
    expect(configuredDefault(ir, "I18nConfig", "@stackra/i18n", "urlStrategy")).toBe(
      "prefix_except_default",
    );
  });

  it("takes the base default for a value of another type", () => {
    const ir = withShapes([override("@stackra/i18n", "config", "ar")]);
    expect(configuredDefault(ir, "I18nConfig", "@stackra/i18n", "locales")).toEqual(["en"]);
  });

  it("takes the base default without an override of that package's class", () => {
    expect(configuredDefault(withShapes([]), "I18nConfig", "@stackra/i18n", "locales")).toEqual([
      "en",
    ]);
    expect(
      configuredDefault(
        withShapes([override("@stackra/i18n-extra")]),
        "I18nConfig",
        "@stackra/i18n",
        "locales",
      ),
    ).toEqual(["en"]);
    expect(
      configuredDefault(
        withShapes([override("@stackra/i18n", "schema")]),
        "I18nConfig",
        "@stackra/i18n",
        "locales",
      ),
    ).toEqual(["en"]);
  });

  it("is undefined for a field with neither an override nor a base default", () => {
    const ir = withShapes([override("@stackra/i18n")]);
    expect(configuredDefault(ir, "I18nConfig", "@stackra/i18n", "fallbacks")).toBeUndefined();
  });
});
