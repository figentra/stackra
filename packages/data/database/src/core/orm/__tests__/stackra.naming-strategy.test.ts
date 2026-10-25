/**
 * Stackra file contract:
 * Purpose: unit tests of `StackraNamingStrategy`: index, unique, foreign-key and check names take the ADR 0231
 *          prefixes without the schema, columns stay snake_case, and other names fall back to MikroORM's.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0231 as amended by ADR 0294; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { StackraNamingStrategy } from "#core/orm/stackra.naming-strategy";

describe(StackraNamingStrategy, () => {
  const naming = new StackraNamingStrategy();

  it("writes idx_, fk_ and ck_ names", () => {
    expect(naming.indexName("orders.orders", ["customer_id", "status"], "index")).toBe(
      "idx_orders_customer_id_status",
    );
    expect(naming.indexName("catalogue.products", ["collection_id", "slug"], "unique")).toBe(
      "idx_products_collection_id_slug",
    );
    expect(naming.indexName("orders.order_lines", ["order_id"], "foreign")).toBe(
      "fk_order_lines_order_id",
    );
    expect(naming.indexName("orders", ["status"], "check")).toBe("ck_orders_status");
  });

  it("keeps snake_case columns and MikroORM's other names", () => {
    expect(naming.propertyToColumnName("paidAt")).toBe("paid_at");
    expect(naming.indexName("orders", ["id"], "primary")).toBe("orders_pkey");
  });
});
