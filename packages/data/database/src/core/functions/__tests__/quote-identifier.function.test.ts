/**
 * Stackra file contract:
 * Purpose: unit tests of the internal name helpers: `quoteIdentifier` quotes snake_case names and refuses anything
 *          else or anything Postgres would truncate, and `constraintName` builds the `idx_`, `fk_` and `ck_` names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0231 as amended by ADR 0294; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";

describe(quoteIdentifier, () => {
  it("quotes a snake_case name", () => {
    expect(quoteIdentifier("order_lines")).toBe('"order_lines"');
  });

  it.each(["Orders", "order-lines", '"x"', "1st", `a${"b".repeat(63)}`])("refuses %s", (name) => {
    expect(() => quoteIdentifier(name)).toThrow(TypeError);
  });

  it("builds constraint names", () => {
    expect(constraintName("idx", "orders", ["customer_id", "status"])).toBe(
      "idx_orders_customer_id_status",
    );
    expect(constraintName("fk", "variants", ["product_id"])).toBe("fk_variants_product_id");
    expect(constraintName("ck", "orders", ["status"])).toBe("ck_orders_status");
  });
});
