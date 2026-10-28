/**
 * Stackra file contract:
 * Purpose: unit tests of `sqlStateOf`: the SQLSTATE comes from `sqlState`, then `code`, on the error or a cause up to
 *          two levels down, and an error without one, or a value that is no object, has none.
 * Boundary: test only; the driver errors are stand-ins carrying a SQLSTATE.
 * Runtime: node (vitest)
 * Governing contract: ADR 0140; data-layer gap mo6; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { sqlStateOf } from "#core/functions/sql-state-of.function";

describe("sqlStateOf", () => {
  it("reads sqlState first, then code, on the error or its causes", () => {
    expect(sqlStateOf(Object.assign(new Error("x"), { sqlState: "40001", code: "ERR" }))).toBe(
      "40001",
    );
    expect(sqlStateOf(Object.assign(new Error("x"), { code: "40P01" }))).toBe("40P01");
    const wrapped = new Error("outer", {
      cause: new Error("middle", { cause: Object.assign(new Error("inner"), { code: "23505" }) }),
    });
    expect(sqlStateOf(wrapped)).toBe("23505");
  });

  it("finds none on a plain error, a deeper cause or a non-object", () => {
    expect(sqlStateOf(new Error("plain"))).toBeUndefined();
    const deep = new Error("a", {
      cause: new Error("b", {
        cause: new Error("c", { cause: Object.assign(new Error("d"), { code: "40001" }) }),
      }),
    });
    expect(sqlStateOf(deep)).toBeUndefined();
    expect(sqlStateOf("40001")).toBeUndefined();
    expect(sqlStateOf(null)).toBeUndefined();
  });
});
