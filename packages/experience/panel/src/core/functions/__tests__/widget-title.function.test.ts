/**
 * Stackra file contract:
 * Purpose: unit tests of `widgetTitle`: the derived title key, and the label key of a part.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { widgetTitle } from "#core/functions/widget-title.function";

describe("widgetTitle", () => {
  it("derives the widget's keys", () => {
    expect(widgetTitle("orders.order_kpis")).toBe("orders::widgets.order_kpis.title");
    expect(widgetTitle("loyalty_kit.points_balance", "revenue")).toBe(
      "loyalty_kit::widgets.points_balance.revenue",
    );
  });
});
