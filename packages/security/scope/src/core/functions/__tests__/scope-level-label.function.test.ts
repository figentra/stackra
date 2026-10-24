/**
 * Stackra file contract:
 * Purpose: unit tests of `scopeLevelLabel`: a level without an alias reads the package's `scope::levels.<key>` key,
 *          which the shipped catalogues hold for the default levels; an alias replaces it.
 * Boundary: test only; reads the shipped catalogues from `assets/lang/{en,ar}/scope.json`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 4).
 */
import { readFileSync } from "node:fs";

import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { ScopeConfig } from "#config/scope.config";
import { scopeLevelLabel } from "#core/functions/scope-level-label.function";

/** The shipped catalogue of `locale`. */
const catalogue = (locale: string) =>
  JSON.parse(
    readFileSync(new URL(`../../../../assets/lang/${locale}/scope.json`, import.meta.url), "utf8"),
  ) as { levels: Record<string, string> };

describe(scopeLevelLabel, () => {
  it("reads the package's key for a level without an alias", () => {
    const config = buildConfig(ScopeConfig);
    for (const { key } of config.levels) {
      expect(scopeLevelLabel(config, key)).toBe(`scope::levels.${key}`);
      for (const locale of ["en", "ar"]) expect(catalogue(locale).levels[key]).toBeTypeOf("string");
    }
  });

  it("reads the deployment's alias when it gave one", () => {
    expect(scopeLevelLabel({ aliases: { product: "app::scope.brand" } }, "product")).toBe(
      "app::scope.brand",
    );
  });
});
