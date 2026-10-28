/**
 * Stackra file contract:
 * Purpose: unit tests of `formulaSql`: names become their operand expression, numbers stay literals, precedence and
 *          parentheses are kept, a division guards its divisor with `nullif`, and a formula outside the grammar throws.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 2); ADR 0154.
 */
import { describe, expect, it } from "@stackra/testing";

import { formulaSql } from "#node/functions/formula-sql.function";

const operand = (name: string): string => `[${name}]`;

describe(formulaSql, () => {
  it("compiles arithmetic with a guarded division", () => {
    expect(formulaSql("paid / orders", operand)).toBe("[paid] / nullif([orders], 0)");
    expect(formulaSql("(paid - refunded) * 100 / orders", operand)).toBe(
      "([paid] - [refunded]) * 100 / nullif([orders], 0)",
    );
    expect(formulaSql("-paid + 1.5", operand)).toBe("(-[paid]) + 1.5");
  });

  it("refuses a formula outside the grammar", () => {
    expect(() => formulaSql("paid; drop table x", operand)).toThrow(TypeError);
    expect(() => formulaSql("sum(paid)", operand)).toThrow(TypeError);
  });
});
