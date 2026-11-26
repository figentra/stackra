/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreSetupImports`: a service with a server entry loads `./environment` first (STA-1571),
 *          then `./database` when it has one (STA-1652); a package and an app get no line.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238; ADR 0212 (decisions 1 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { encoreSetupImports } from "#core/functions/encore-setup-imports.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("encoreSetupImports", () => {
  it("imports the environment, then the database, of a service that has both", () => {
    expect(encoreSetupImports(COMMERCE_IR)).toEqual([
      'import "./environment";',
      'import "./database";',
    ]);
  });

  it("imports nothing for a package or an app", () => {
    expect(encoreSetupImports(LOYALTY_KIT_IR)).toEqual([]);
    expect(encoreSetupImports({ ...COMMERCE_IR, layout: "app" })).toEqual([]);
  });
});
