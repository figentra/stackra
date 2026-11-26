/**
 * Stackra file contract:
 * Purpose: unit tests of `parseDiagnostics`: TypeScript's plain and pretty diagnostics, oxlint's findings in its
 *          piped (ASCII) and terminal (Unicode) reporters with the place on the next line, a Turborepo prefix, and one
 *          report per repeated finding; text with none gives none.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2873.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseDiagnostics } from "#node/functions/parse-diagnostics.function";

describe("parseDiagnostics", () => {
  it("reads tsc diagnostics, plain and pretty, after a task prefix", () => {
    const output = [
      "@acme/a:typecheck: src/c.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'.",
      "src/d.ts:7:1 - warning TS6133: 'x' is declared but its value is never read.",
      "src/c.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'.",
      "Found 2 errors.",
    ].join("\n");
    expect(parseDiagnostics(output)).toEqual([
      {
        file: "src/c.ts",
        line: 2,
        column: 14,
        severity: "error",
        code: "TS2322",
        message: "Type 'string' is not assignable to type 'number'.",
      },
      {
        file: "src/d.ts",
        line: 7,
        column: 1,
        severity: "warning",
        code: "TS6133",
        message: "'x' is declared but its value is never read.",
      },
    ]);
  });

  it("reads oxlint findings with their place, as piped and on a terminal", () => {
    const output = [
      "",
      "  ! eslint(no-unused-vars): Variable 'unused' is declared but never used.",
      "   ,-[src/c.ts:1:7]",
      " 1 | const unused = 1;",
      "   `----",
      "  x typescript(no-explicit-any): Unexpected any.",
      "   ,-[src/e.ts:4:12]",
      "  × eslint(no-debugger): `debugger` statement is not allowed",
      "   ╭─[src/f.ts:3:1]",
      "  ⚠ unicorn(no-null): Use undefined",
      "   ╭─[src/g.ts:9:2]",
      "Found 2 warnings and 2 errors.",
    ].join("\n");
    expect(parseDiagnostics(output)).toEqual([
      {
        file: "src/c.ts",
        line: 1,
        column: 7,
        severity: "warning",
        code: "eslint(no-unused-vars)",
        message: "Variable 'unused' is declared but never used.",
      },
      {
        file: "src/e.ts",
        line: 4,
        column: 12,
        severity: "error",
        code: "typescript(no-explicit-any)",
        message: "Unexpected any.",
      },
      {
        file: "src/f.ts",
        line: 3,
        column: 1,
        severity: "error",
        code: "eslint(no-debugger)",
        message: "`debugger` statement is not allowed",
      },
      {
        file: "src/g.ts",
        line: 9,
        column: 2,
        severity: "warning",
        code: "unicorn(no-null)",
        message: "Use undefined",
      },
    ]);
  });

  it("finds nothing in output without diagnostics", () => {
    expect(
      parseDiagnostics("Finished in 38ms on 1 file with 96 rules using 16 threads.\n"),
    ).toEqual([]);
  });
});
