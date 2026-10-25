/**
 * Stackra file contract:
 * Purpose: unit tests of `groupRows`: one group of every row without grouping, groups in first-met order with counts
 *          and totals, sub-groups, missing values grouped as null, and totals that skip non-numbers and are null when
 *          no number is there.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { describe, expect, it } from "@stackra/testing";

import { groupRows } from "#core/functions/group-rows.function";

const rows = [
  { id: "a", status: "paid", channel: "web", totals: { totalMinor: 1_000 } },
  { id: "b", status: "open", channel: "pos", totals: { totalMinor: 500 } },
  { id: "c", status: "paid", channel: "pos", totals: { totalMinor: 3_000 } },
  { id: "d", channel: "web", totals: { totalMinor: "n/a" } },
];
const totals = [
  { key: "totals.totalMinor", aggregate: "sum" as const },
  { key: "id", aggregate: "count" as const },
  { key: "totals.totalMinor", aggregate: "max" as const },
];

describe("groupRows", () => {
  it("makes one group of every row without grouping", () => {
    expect(
      groupRows(rows, { totals: [{ key: "totals.totalMinor", aggregate: "average" }] }),
    ).toEqual([{ value: null, count: 4, totals: { "average:totals.totalMinor": 1_500 }, rows }]);
  });

  it("groups in first-met order with counts and totals", () => {
    const groups = groupRows(rows, { group: { by: "status" }, totals });
    expect(groups.map((group) => [group.value, group.count])).toEqual([
      ["paid", 2],
      ["open", 1],
      [null, 1],
    ]);
    expect(groups[0]?.totals).toEqual({
      "sum:totals.totalMinor": 4_000,
      "count:id": 2,
      "max:totals.totalMinor": 3_000,
    });
    expect(groups[2]?.totals["sum:totals.totalMinor"]).toBeNull();
    expect(groups[0]?.rows?.map((row) => row.id)).toEqual(["a", "c"]);
  });

  it("sub-groups each group", () => {
    const [paid] = groupRows(rows, {
      // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
      group: { by: "status", then: "channel" },
      totals: [{ key: "totals.totalMinor", aggregate: "min" }],
    });
    expect(paid?.rows).toBeUndefined();
    expect(
      paid?.groups?.map((group) => [group.value, group.totals["min:totals.totalMinor"]]),
    ).toEqual([
      ["web", 1_000],
      ["pos", 3_000],
    ]);
  });
});
