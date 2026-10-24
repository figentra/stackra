/**
 * Stackra file contract:
 * Purpose: unit tests of `tableName`: snake plural in the module's Postgres schema, so two modules may share a model
 *          name without a table collision.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { tableName } from "#core/functions/table-name.function";

describe("tableName", () => {
  it("qualifies the plural table by module", () => {
    expect(tableName("orders", "OrderLine")).toBe("orders.order_lines");
    expect(tableName("orders", "Tag")).not.toBe(tableName("catalogue", "Tag"));
  });
});
