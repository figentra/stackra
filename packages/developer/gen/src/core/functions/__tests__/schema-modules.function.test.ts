/**
 * Stackra file contract:
 * Purpose: unit tests of `schemaModules`: every module with a shape, an enum, an action, a query or a config gets a
 *          schemas file, sorted, each once.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); registry v3.1 gap G1.
 */
import { describe, expect, it } from "@stackra/testing";

import { schemaModules } from "#core/functions/schema-modules.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("schemaModules", () => {
  it("lists each module with something to compile, sorted", () => {
    expect(schemaModules(COMMERCE_IR)).toEqual(["commerce", "orders"]);
    expect(schemaModules(BILLING_IR)).toEqual(["billing", "crm"]);
  });

  it("lists none for a member without shapes, enums, actions, queries or configs", () => {
    expect(schemaModules(WEB_APP_IR)).toEqual([]);
  });
});
