/**
 * Stackra file contract:
 * Purpose: unit tests of `resourceLabel`: the derived key of a resource's title and of a part's name, dotted and
 *          camelCase paths written in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { resourceLabel } from "#core/functions/resource-label.function";

describe("resourceLabel", () => {
  it("derives the title key", () => {
    expect(resourceLabel("loyalty_kit.loyalty_account", "title")).toBe(
      "loyalty_kit::resources.loyalty_account.title",
    );
  });

  it("derives a part's key from a dotted camelCase path", () => {
    expect(resourceLabel("orders.order", "columns", "totals.totalMinor")).toBe(
      "orders::resources.order.columns.totals_total_minor",
    );
  });
});
