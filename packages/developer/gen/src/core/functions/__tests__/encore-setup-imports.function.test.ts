/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreSetupImports` (STA-2844): a generated Encore file loads `./environment` first, then
 *          `./database`, each only when its file is written.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238; ADR 0296 (amendment 2026-11-26); STA-1652; STA-2844.
 */
import { describe, expect, it } from "@stackra/testing";

import { encoreSetupImports } from "#core/functions/encore-setup-imports.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("encoreSetupImports", () => {
  it("loads the environment first, then the database", () => {
    expect(encoreSetupImports({ ...COMMERCE_IR, packages: ["@stackra/app"] })).toEqual([
      'import "./environment";',
      'import "./database";',
    ]);
  });

  it("loads only what is written", () => {
    expect(encoreSetupImports({ ...COMMERCE_IR, packages: ["@stackra/app"], classes: [] })).toEqual(
      ['import "./environment";'],
    );
    expect(encoreSetupImports({ ...COMMERCE_IR, authoredMain: true })).toEqual([
      'import "./database";',
    ]);
    expect(encoreSetupImports(LOYALTY_KIT_IR)).toEqual([]);
  });
});
