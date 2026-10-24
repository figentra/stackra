/**
 * Stackra file contract:
 * Purpose: unit tests of the internal `sqlLiteral`: each constant kind's literal, quotes doubled, jsonb for arrays and
 *          objects, and refusals for values with no literal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { sqlLiteral } from "#core/functions/sql-literal.function";

describe(sqlLiteral, () => {
  it.each([
    [null, "null"],
    [true, "true"],
    [0, "0"],
    ["it's", "'it''s'"],
    [[], "'[]'::jsonb"],
    [{ size: "M" }, `'{"size":"M"}'::jsonb`],
  ])("writes %j as %s", (value, literal) => {
    expect(sqlLiteral(value)).toBe(literal);
  });

  it("refuses a non-finite number and an undefined value", () => {
    expect(() => sqlLiteral(Number.NaN)).toThrow(TypeError);
    expect(() => sqlLiteral(undefined)).toThrow(TypeError);
  });
});
