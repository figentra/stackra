/**
 * Stackra file contract:
 * Purpose: unit tests of `hiddenColumns`: an unruled column shows, a permission column shows only when held, and a
 *          classified column shows only under a held permission.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 6); ADR 0341.
 */
import { describe, expect, it } from "@stackra/testing";

import { hiddenColumns } from "#core/functions/hidden-columns.function";

const columns = {
  status: {},
  margin: { permission: "orders.order.margin" },
  email: { dataClass: "personal" },
  phone: { dataClass: "personal", permission: "orders.customer.contact" },
};

describe(hiddenColumns, () => {
  it("hides what the caller does not hold", () => {
    expect(hiddenColumns(columns, new Set())).toEqual(["margin", "email", "phone"]);
    expect(hiddenColumns(columns, new Set(["orders.order.margin"]))).toEqual(["email", "phone"]);
    expect(
      hiddenColumns(columns, new Set(["orders.order.margin", "orders.customer.contact"])),
    ).toEqual(["email"]);
  });
});
