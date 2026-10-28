/**
 * Stackra file contract:
 * Purpose: unit tests of `filterSql`: every table filter operator compiles to a parameterised condition on the given
 *          column, `contains` escapes its wildcards, and values outside the vocabulary (an unknown operator, an object
 *          operand, an empty range, a named date range) are refused with `table_filter_invalid`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 2); ADR 0160.
 */
import { TableFilterInvalidError } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { filterSql } from "#node/functions/filter-sql.function";

const COLUMN = 'row."status"';

describe(filterSql, () => {
  it("compiles scalars, null and lists", () => {
    expect(filterSql(COLUMN, "status", "paid")).toEqual({ sql: `${COLUMN} = ?`, params: ["paid"] });
    expect(filterSql(COLUMN, "status", null)).toEqual({ sql: `${COLUMN} is null`, params: [] });
    expect(filterSql(COLUMN, "status", ["a", "b"])).toEqual({
      sql: `${COLUMN} in (?, ?)`,
      params: ["a", "b"],
    });
    expect(filterSql(COLUMN, "status", [])).toEqual({ sql: "false", params: [] });
  });

  it("compiles ranges, date ranges and comparisons", () => {
    expect(filterSql(COLUMN, "x", { op: "range", from: 1, to: 5 })).toEqual({
      sql: `${COLUMN} >= ? and ${COLUMN} <= ?`,
      params: [1, 5],
    });
    expect(
      filterSql(COLUMN, "x", { op: "dateRange", from: "2026-10-01", to: "2026-10-01" }),
    ).toEqual({
      sql: `${COLUMN} >= ? and ${COLUMN} < ?`,
      params: [new Date("2026-10-01T00:00:00Z"), new Date("2026-10-02T00:00:00Z")],
    });
    expect(filterSql(COLUMN, "x", { op: "gte", value: 3 })).toEqual({
      sql: `${COLUMN} >= ?`,
      params: [3],
    });
    expect(filterSql(COLUMN, "x", { op: "ne", value: 3 }).sql).toBe(`${COLUMN} <> ?`);
    expect(filterSql(COLUMN, "x", { op: "isNull", value: false }).sql).toBe(
      `${COLUMN} is not null`,
    );
  });

  it("escapes contains", () => {
    expect(filterSql(COLUMN, "x", { op: "contains", value: "50%_\\" })).toEqual({
      sql: `${COLUMN} ilike ?`,
      params: ["%50\\%\\_\\\\%"],
    });
  });

  it("refuses values outside the vocabulary", () => {
    for (const value of [
      { op: "like", value: "a" },
      { op: "gt", value: { $raw: "1" } },
      { op: "range" },
      { op: "dateRange", range: "last_7_days" },
      [{ a: 1 }],
    ])
      expect(() => filterSql(COLUMN, "x", value)).toThrow(TableFilterInvalidError);
  });
});
