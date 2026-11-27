/**
 * Stackra file contract:
 * Purpose: unit tests of `formatGenError`: the location line, the fix line and the docs line (the code's group in the
 *          error-code reference and its `stackra explain` command), with a whole-file error printed without a
 *          position, a warning printed with the word `warning`, and a code the reference does not list linked to the
 *          page itself.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0101 (Enforcement: gen warns); STA-2891.
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

const DOCS =
  "  docs: https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields (stackra explain shape_number_kind)";

describe("formatGenError", () => {
  it("prints the location, code, subject, message, fix and docs link", () => {
    expect(formatGenError(ERROR)).toBe(
      `src/node/schemas/x.schema.ts:4:3 error shape_number_kind X.count: a number field needs @Int or @Num\n  fix: add @Int\n${DOCS}`,
    );
    expect(
      formatGenError({ ...ERROR, line: 0, column: 0 }).startsWith(
        "src/node/schemas/x.schema.ts error",
      ),
    ).toBe(true);
  });

  it("prints a warning with the word warning and the same fix and docs lines", () => {
    expect(formatGenError({ ...ERROR, severity: "warning" })).toBe(
      `src/node/schemas/x.schema.ts:4:3 warning shape_number_kind X.count: a number field needs @Int or @Num\n  fix: add @Int\n${DOCS}`,
    );
    expect(formatGenError({ ...ERROR, severity: "warning" })).toBe(
      formatGenError(ERROR).replace(" error ", " warning "),
    );
  });

  it("links a code the reference does not list to the reference page", () => {
    expect(formatGenError({ ...ERROR, code: "not_listed" }).split("\n")[2]).toBe(
      "  docs: https://docs.stackra.figentra.com/customers/error-codes (stackra explain not_listed)",
    );
  });
});
