/**
 * Stackra file contract:
 * Purpose: unit tests of `groupRows`: one group of every row without grouping, groups in first-met order with counts
 *          and totals, sub-groups, missing values grouped as null, totals that skip non-numbers and are null when no
 *          number is there, and `distinct` counting distinct non-null values.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { describe, expect, it } from "@stackra/testing";

import { groupRows } from "#core/functions/group-rows.function";
import { SavedViewGroup } from "#core/schemas/saved-view-group.schema";
import { SavedViewTotal } from "#core/schemas/saved-view-total.schema";

const rows = [
  { id: "a", status: "paid", channel: "web", totals: { totalMinor: 1000 } },
  { id: "b", status: "open", channel: "pos", totals: { totalMinor: 500 } },
  { id: "c", status: "paid", channel: "pos", totals: { totalMinor: 3000 } },
  { id: "d", channel: "web", totals: { totalMinor: "n/a" } },
];
const totals = [
  SavedViewTotal.create({ key: "totals.totalMinor", aggregate: "sum" }),
  SavedViewTotal.create({ key: "id", aggregate: "count" }),
  SavedViewTotal.create({ key: "totals.totalMinor", aggregate: "max" }),
];

describe("groupRows", () => {
  it("makes one group of every row without grouping", () => {
    expect(
      groupRows(rows, {
        totals: [SavedViewTotal.create({ key: "totals.totalMinor", aggregate: "avg" })],
      }),
    ).toEqual([{ value: null, count: 4, totals: { "avg:totals.totalMinor": 1500 }, rows }]);
  });

  it("counts distinct non-null values", () => {
    const [all] = groupRows(rows, {
      totals: [SavedViewTotal.create({ key: "status", aggregate: "distinct" })],
    });
    expect(all?.totals).toEqual({ "distinct:status": 2 });
  });

  it("groups in first-met order with counts and totals", () => {
    const groups = groupRows(rows, { group: SavedViewGroup.create({ by: "status" }), totals });
    expect(groups.map((group) => [group.value, group.count])).toEqual([
      ["paid", 2],
      ["open", 1],
      [null, 1],
    ]);
    expect(groups[0]?.totals).toEqual({
      "sum:totals.totalMinor": 4000,
      "count:id": 2,
      "max:totals.totalMinor": 3000,
    });
    expect(groups[2]?.totals["sum:totals.totalMinor"]).toBeNull();
    expect(groups[0]?.rows?.map((row) => row.id)).toEqual(["a", "c"]);
  });

  it("sub-groups each group", () => {
    const [paid] = groupRows(rows, {
      // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
      group: SavedViewGroup.create({ by: "status", then: "channel" }),
      totals: [SavedViewTotal.create({ key: "totals.totalMinor", aggregate: "min" })],
    });
    expect(paid?.rows).toBeUndefined();
    expect(
      paid?.groups?.map((group) => [group.value, group.totals["min:totals.totalMinor"]]),
    ).toEqual([
      ["web", 1000],
      ["pos", 3000],
    ]);
  });
});
