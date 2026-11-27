/**
 * Stackra file contract:
 * Purpose: unit tests of `parseGenOutput`: gen's refusals and warnings, with and without a place, each a `Diagnostic`
 *          of phase `gen` with the fix printed under it and the docs link of gen's `docs:` line as `docsUrl`; a fix or
 *          docs line that does not sit right under a finding is not read; other lines are not findings.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 22); STA-2873; STA-2886.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseGenOutput } from "#node/functions/parse-gen-output.function";

/** The error-code reference entry gen links for `shape_number_kind`. */
const DOCS = "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields";

describe("parseGenOutput", () => {
  it("reads each refusal and warning with its fix and docs link", () => {
    const output = [
      "wrote ./stackra.manifest.json",
      "src/a.ts:4:3 error shape_number_kind Orders.total: a number needs a kind",
      "  fix: use @Int or @Num",
      `  docs: ${DOCS} (stackra explain shape_number_kind)`,
      "stackra.config.ts warning config_unused Acme: nothing reads it",
      "gen: 1 error(s) in .; nothing was written",
    ].join("\n");
    expect(parseGenOutput(output)).toEqual([
      {
        phase: "gen",
        file: "src/a.ts",
        line: 4,
        column: 3,
        severity: "error",
        code: "shape_number_kind",
        message: "Orders.total: a number needs a kind",
        fix: "use @Int or @Num",
        docsUrl: DOCS,
      },
      {
        phase: "gen",
        file: "stackra.config.ts",
        severity: "warning",
        code: "config_unused",
        message: "Acme: nothing reads it",
      },
    ]);
  });

  it("reads a fix or docs line only right under its finding", () => {
    const output = [
      "src/a.ts:4:3 error shape_number_kind Orders.total: a number needs a kind",
      "wrote ./stackra.manifest.json",
      "  fix: not this finding's",
      `  docs: ${DOCS} (stackra explain shape_number_kind)`,
    ].join("\n");
    expect(parseGenOutput(output)).toEqual([
      {
        phase: "gen",
        file: "src/a.ts",
        line: 4,
        column: 3,
        severity: "error",
        code: "shape_number_kind",
        message: "Orders.total: a number needs a kind",
      },
    ]);
  });
});
