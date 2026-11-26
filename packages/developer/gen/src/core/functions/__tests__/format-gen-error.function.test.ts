/**
 * Stackra file contract:
 * Purpose: unit tests of `formatGenError`: the location line and the fix line, with a whole-file error printed
 *          without a position, and a warning printed with the word `warning`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0101 (Enforcement: gen warns).
 */
import { describe, expect, it } from "@stackra/testing";

import { formatGenError } from "#core/functions/format-gen-error.function";

const ERROR = {
  code: "shape_number_kind",
  file: "src/node/schemas/x.schema.ts",
  line: 4,
  column: 3,
  subject: "X.count",
  message: "a number field needs @Int or @Num",
  fix: "add @Int",
};

describe("formatGenError", () => {
  it("prints the location, code, subject, message and fix", () => {
    expect(formatGenError(ERROR)).toBe(
      "src/node/schemas/x.schema.ts:4:3 error shape_number_kind X.count: a number field needs @Int or @Num\n  fix: add @Int",
    );
    expect(
      formatGenError({ ...ERROR, line: 0, column: 0 }).startsWith(
        "src/node/schemas/x.schema.ts error",
      ),
    ).toBe(true);
  });

  it("prints a warning with the word warning and the same fix line", () => {
    expect(formatGenError({ ...ERROR, severity: "warning" })).toBe(
      "src/node/schemas/x.schema.ts:4:3 warning shape_number_kind X.count: a number field needs @Int or @Num\n  fix: add @Int",
    );
    expect(formatGenError({ ...ERROR, severity: "warning" })).toBe(
      formatGenError(ERROR).replace(" error ", " warning "),
    );
  });
});
