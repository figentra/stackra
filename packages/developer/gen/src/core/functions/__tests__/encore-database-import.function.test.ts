/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreDatabaseImport`: a service with a database loads `./database` first; a service
 *          without one, a package and an app get no line.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238; STA-1652.
 */
import { describe, expect, it } from "@stackra/testing";

import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("encoreDatabaseImport", () => {
  it("imports the Encore database of a service that has one", () => {
    expect(encoreDatabaseImport(COMMERCE_IR)).toEqual(['import "./database";']);
  });

  it("imports nothing without a database", () => {
    expect(encoreDatabaseImport({ ...COMMERCE_IR, classes: [] })).toEqual([]);
    expect(encoreDatabaseImport(LOYALTY_KIT_IR)).toEqual([]);
  });
});
