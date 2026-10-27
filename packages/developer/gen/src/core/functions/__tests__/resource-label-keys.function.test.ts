/**
 * Stackra file contract:
 * Purpose: unit tests of `resourceLabelKeys`: the title always; columns and filters of the table; entries (a list's
 *          columns too) and sections of the infolist; fields, nested fields and steps of the form; leaves in
 *          snake_case as the panel derives them; anything unrecognised skipped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 6); STA-1385.
 */
import { describe, expect, it } from "@stackra/testing";

import { resourceLabelKeys } from "#core/functions/resource-label-keys.function";

describe(resourceLabelKeys, () => {
  it("derives the title, table, infolist and form keys", () => {
    const tree = {
      options: {},
      table: {
        columns: [{ kind: "money", key: "totals.totalMinor" }],
        filters: [{ kind: "value", key: "status" }, { kind: "trashed" }],
        count: "exact",
      },
      infolist: {
        entries: [
          { kind: "section", name: "summary", entries: [{ kind: "value", key: "placedAt" }] },
          { kind: "list", key: "lines", columns: ["sku"] },
        ],
      },
      form: {
        fields: [
          { kind: "grid", columns: 2, fields: [{ kind: "value", key: "customerId" }] },
          {
            kind: "steps",
            name: "wizard",
            steps: [{ name: "address", fields: [{ kind: "value", key: "city" }] }],
          },
        ],
      },
    };
    expect(resourceLabelKeys("orders.order", tree)).toEqual([
      "orders::resources.order.columns.totals_total_minor",
      "orders::resources.order.entries.lines",
      "orders::resources.order.entries.lines_sku",
      "orders::resources.order.entries.placed_at",
      "orders::resources.order.fields.city",
      "orders::resources.order.fields.customer_id",
      "orders::resources.order.filters.status",
      "orders::resources.order.sections.summary",
      "orders::resources.order.steps.address",
      "orders::resources.order.title",
    ]);
  });

  it("gives the title alone for an empty or unknown tree", () => {
    expect(resourceLabelKeys("orders.order", undefined)).toEqual(["orders::resources.order.title"]);
    expect(resourceLabelKeys("orders.order", { table: "x" })).toEqual([
      "orders::resources.order.title",
    ]);
  });
});
