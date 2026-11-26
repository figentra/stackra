/**
 * Stackra file contract:
 * Purpose: unit tests of `parseGenOutput`: gen's refusals and warnings, with and without a place, each with the fix
 *          printed under it; other lines are not findings.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 22); STA-2873.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseGenOutput } from "#node/functions/parse-gen-output.function";

describe("parseGenOutput", () => {
  it("reads each refusal and warning with its fix", () => {
    const output = [
      "wrote ./stackra.manifest.json",
      "src/a.ts:4:3 error shape_number_kind Orders.total: a number needs a kind",
      "  fix: use @Int or @Num",
      "stackra.config.ts warning config_unused Acme: nothing reads it",
      "gen: 1 error(s) in .; nothing was written",
    ].join("\n");
    expect(parseGenOutput(output)).toEqual([
      {
        file: "src/a.ts",
        line: 4,
        column: 3,
        severity: "error",
        code: "shape_number_kind",
        message: "Orders.total: a number needs a kind",
        fix: "use @Int or @Num",
      },
      {
        file: "stackra.config.ts",
        severity: "warning",
        code: "config_unused",
        message: "Acme: nothing reads it",
      },
    ]);
  });
});
