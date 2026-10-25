/**
 * Stackra file contract:
 * Purpose: unit tests of `Relation.table`: a frozen relation node with its query, columns and bound inputs.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { Column } from "#core/constants/column.constant";
import { Relation } from "#core/constants/relation.constant";

class ListOrderLinesQuery {}

describe("Relation", () => {
  it("builds a frozen relation node", () => {
    const relation = Relation.table(ListOrderLinesQuery, {
      bind: { orderId: "record.id" },
      columns: [Column.from("sku")],
    });
    expect(relation).toEqual({
      kind: "table",
      query: ListOrderLinesQuery,
      columns: [{ kind: "value", key: "sku" }],
      bind: { orderId: "record.id" },
    });
    expect(Relation.table(ListOrderLinesQuery, { columns: [] })).not.toHaveProperty("bind");
  });
});
