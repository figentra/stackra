/**
 * Stackra file contract:
 * Purpose: unit tests of `coalesceChanges`: one change per row in first-seen order; created then updated stays created
 *          with joined fields; a delete supersedes with no fields or `after`; `before` keeps the earliest values and
 *          `after` the latest.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gap se3.
 */
import { describe, expect, it } from "@stackra/testing";

import { RowChangeKind } from "#contracts/index";
import { coalesceChanges } from "#core/functions/coalesce-changes.function";

describe(coalesceChanges, () => {
  it("keeps a created row created, joining the fields and values", () => {
    expect(
      coalesceChanges([
        {
          model: "Product",
          id: "prd_1",
          kind: RowChangeKind.Created,
          fields: ["name"],
          after: { name: "A" },
        },
        { model: "Order", id: "ord_1", kind: RowChangeKind.Updated, fields: ["total"] },
        {
          model: "Product",
          id: "prd_1",
          kind: RowChangeKind.Updated,
          fields: ["name", "price"],
          before: { name: "A", price: 1 },
          after: { name: "B", price: 2 },
        },
      ]),
    ).toEqual([
      {
        model: "Product",
        id: "prd_1",
        kind: RowChangeKind.Created,
        fields: ["name", "price"],
        before: { name: "A", price: 1 },
        after: { name: "B", price: 2 },
      },
      { model: "Order", id: "ord_1", kind: RowChangeKind.Updated, fields: ["total"] },
    ]);
  });

  it("lets a delete supersede, keeping the earliest before values", () => {
    expect(
      coalesceChanges([
        {
          model: "Product",
          id: "prd_1",
          kind: RowChangeKind.Updated,
          fields: ["name"],
          before: { name: "A" },
          after: { name: "B" },
        },
        {
          model: "Product",
          id: "prd_1",
          kind: RowChangeKind.Deleted,
          fields: [],
          before: { name: "B" },
        },
      ]),
    ).toEqual([
      {
        model: "Product",
        id: "prd_1",
        kind: RowChangeKind.Deleted,
        fields: [],
        before: { name: "A" },
      },
    ]);
  });
});
