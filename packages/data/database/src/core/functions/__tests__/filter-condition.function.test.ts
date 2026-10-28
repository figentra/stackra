/**
 * Stackra file contract:
 * Purpose: unit tests of `filterCondition`: a value is equal, a list `$in`, and each operator of the `TableFilter`
 *          vocabulary builds its own condition; a named date range resolves through `period`; anything else is refused
 *          with `table_filter_invalid`, so no caller object reaches the ORM as an operator.
 * Boundary: test only; pure, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rule 2); reporting gap 5; ADR 0022; ADR 0269.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TableFilterInvalidError } from "#core/errors/table-filter-invalid.error";
import { filterCondition } from "#core/functions/filter-condition.function";

const from = new Date("2026-10-22T00:00:00Z");
const to = new Date("2026-10-29T00:00:00Z");
const period = (input: { readonly range?: string | null }) => {
  if (input.range !== "last_7_days") throw new RangeError("unknown range");
  return { from, to, days: 7, previous: { from: new Date(0), to: from } };
};

/** The refusal `run` throws. */
function refusal(run: () => unknown): TableFilterInvalidError {
  try {
    run();
  } catch (error) {
    if (isRefusal(error, TableFilterInvalidError)) return error;
    throw error;
  }
  throw new Error("expected a refusal");
}

describe(filterCondition, () => {
  it("keeps a scalar or null as equal and turns a list into $in", () => {
    expect(filterCondition("status", "paid")).toBe("paid");
    expect(filterCondition("paidAt", null)).toBeNull();
    expect(filterCondition("status", ["paid", "pending"])).toEqual({ $in: ["paid", "pending"] });
  });

  it("builds a range with inclusive bounds, either one optional", () => {
    expect(filterCondition("total", { op: "range", from: 10, to: 20 })).toEqual({
      $gte: 10,
      $lte: 20,
    });
    expect(filterCondition("total", { op: "range", to: 20 })).toEqual({ $lte: 20 });
  });

  it("builds a date range: from inclusive, to exclusive, a date-only to covering its whole day", () => {
    expect(
      filterCondition("createdAt", { op: "dateRange", from: "2026-10-01", to: "2026-10-28" }),
    ).toEqual({
      $gte: new Date("2026-10-01T00:00:00Z"),
      $lt: new Date("2026-10-29T00:00:00Z"),
    });
    expect(filterCondition("createdAt", { op: "dateRange", to: "2026-10-28T12:00:00Z" })).toEqual({
      $lt: new Date("2026-10-28T12:00:00Z"),
    });
  });

  it("resolves a named date range through the call's period", () => {
    expect(filterCondition("createdAt", { op: "dateRange", range: "last_7_days" }, period)).toEqual(
      { $gte: from, $lt: to },
    );
  });

  it("builds a comparison, contains (escaped) and isNull", () => {
    expect(filterCondition("total", { op: "gte", value: 5 })).toEqual({ $gte: 5 });
    expect(filterCondition("status", { op: "ne", value: "void" })).toEqual({ $ne: "void" });
    expect(filterCondition("name", { op: "contains", value: "50%_a\\" })).toEqual({
      $ilike: "%50\\%\\_a\\\\%",
    });
    expect(filterCondition("paidAt", { op: "isNull", value: true })).toBeNull();
    expect(filterCondition("paidAt", { op: "isNull", value: false })).toEqual({ $ne: null });
  });

  it("refuses anything outside the vocabulary", () => {
    for (const [value, reason] of [
      [{ $like: "%a%" }, "unknown operator undefined"],
      [{ op: "constructor", value: 1 }, 'unknown operator "constructor"'],
      [{ op: "gt", value: { $ne: 1 } }, "value is not a scalar value"],
      [[{ $ne: 1 }], "a list holds only scalar values"],
      [{ op: "range" }, "a range needs from or to"],
      [{ op: "contains", value: "" }, "contains needs non-empty text"],
      [{ op: "isNull", value: "yes" }, "isNull needs true or false"],
      [{ op: "dateRange", from: "not a date" }, "from is not a date"],
      [
        { op: "dateRange", range: "last_7_days" },
        "the named range last_7_days needs the call's period",
      ],
    ] as const) {
      const error = refusal(() => filterCondition("total", value));
      expect(error.toEnvelope()).toMatchObject({
        code: "table_filter_invalid",
        details: { key: "total", reason },
      });
    }
    expect(
      refusal(() => filterCondition("createdAt", { op: "dateRange", range: "next_year" }, period))
        .reason,
    ).toBe('unknown named range "next_year"');
  });
});
