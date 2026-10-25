/**
 * Stackra file contract:
 * Purpose: unit tests of `document`: the route constant joins the panel's mount path, and a bad key or path is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 20); owner decision R-56.
 */
import { ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { document } from "#core/functions/document.function";

const ADMIN = { key: "admin", path: "/", area: ApiArea.Admin };
const PORTAL = { key: "customer_portal", path: "/portal", area: ApiArea.App };

describe("document", () => {
  it("joins the panel's mount path", () => {
    expect(
      document("orders.sales_overview", {
        path: "/sales",
        panel: ADMIN,
        permission: "orders.order.read",
      }),
    ).toEqual({
      key: "orders.sales_overview",
      name: "orders.sales_overview",
      path: "/sales",
      panel: ADMIN,
      permission: "orders.order.read",
    });
    expect(document("orders.my_orders", { path: "/orders", panel: PORTAL }).path).toBe(
      "/portal/orders",
    );
  });

  it("refuses a bad key or path", () => {
    expect(() => document("sales", { path: "/sales", panel: ADMIN })).toThrow(RangeError);
    expect(() => document("orders.sales", { path: "sales", panel: ADMIN })).toThrow(RangeError);
  });
});
