/**
 * Stackra file contract:
 * Purpose: proves `brandTheme` lays a brand layer over the Stackra base, derives the accent palette steps a layer
 *          leaves out (Figentra) and keeps the ones it sets (Commerce), and that every offered brand builds.
 * Boundary: the builder and the vendored layers alone.
 * Runtime: node
 * Governing contract: ADR 0340; ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { describe, expect, it } from "vitest";

import { brandTheme } from "../brand-theme.function";
import { BRAND_THEMES } from "../brand-themes.constant";
import COMMERCE from "../brand-themes/commerce.json";
import FIGENTRA from "../brand-themes/figentra.json";

describe("brandTheme", () => {
  it("derives the accent steps a layer leaves out", () => {
    const theme = brandTheme(FIGENTRA);
    expect(theme.colors.accent.light).toBe(FIGENTRA.changes.colors.accent.light);
    expect(theme.palette["accent-hover"]).not.toEqual(STACKRA_THEME.palette["accent-hover"]);
    expect(theme.palette["amber"]).toBeDefined();
  });

  it("keeps the accent steps a layer sets", () => {
    expect(brandTheme(COMMERCE).palette["accent-hover"]?.light).toBe(
      COMMERCE.changes.palette["accent-hover"].light,
    );
  });

  it("builds every offered brand", () => {
    expect(new Set(BRAND_THEMES.map(({ theme }) => theme.name)).size).toBe(BRAND_THEMES.length);
  });
});
