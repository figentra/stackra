/**
 * Stackra file contract:
 * Purpose: unit tests of `parseCheckOutput`, `checkReport` and `checkDiagnostics`: the JSON report that ends a check
 *          run is read past the phase notices before it, an empty report is no findings, each finding becomes a
 *          `Diagnostic` (its phase, `<tool>/<rule>` code, file, place, message and `stackra check --fix` when fixable),
 *          the counts are by phase and severity, and output without a report says so, never a clean run.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); STA-2873; STA-2886.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkDiagnostics } from "#node/functions/check-diagnostics.function";
import { checkReport } from "#node/functions/check-report.function";
import { parseCheckOutput } from "#node/functions/parse-check-output.function";

const FINDINGS = [
  {
    phase: "lint",
    tool: "oxlint",
    rule: "eslint(no-debugger)",
    path: "a.ts",
    line: 3,
    column: 5,
    message: "`debugger` statement is not allowed",
    severity: "error",
    fixable: false,
    adr: null,
    tags: ["x"],
  },
  {
    phase: "format",
    tool: "oxfmt",
    rule: "format",
    path: "b.ts",
    line: null,
    column: null,
    message: "not formatted",
    severity: "warning",
    fixable: true,
    adr: null,
  },
  {
    phase: "structure",
    tool: "repo-checks",
    rule: "imports",
    path: ".",
    line: null,
    column: null,
    message: "a package imports an app",
    severity: "error",
    fixable: false,
    adr: "0003",
  },
];

const DIAGNOSTICS = [
  {
    phase: "lint",
    code: "oxlint/eslint(no-debugger)",
    severity: "error",
    file: "a.ts",
    line: 3,
    column: 5,
    message: "`debugger` statement is not allowed",
  },
  {
    phase: "format",
    code: "oxfmt/format",
    severity: "warning",
    file: "b.ts",
    message: "not formatted",
    fix: "stackra check --fix",
  },
  {
    phase: "structure",
    code: "repo-checks/imports",
    severity: "error",
    message: "a package imports an app",
  },
];

describe("parseCheckOutput", () => {
  it("reads the report after the phase notices", () => {
    const output = `format: 120 files\n[note] lint skipped 2 files\n${JSON.stringify(FINDINGS, null, 2)}\n`;
    expect(parseCheckOutput(output)).toEqual(FINDINGS);
    expect(parseCheckOutput("config: ok\n[]\n")).toEqual([]);
  });

  it("is undefined when no report ends the output", () => {
    expect(parseCheckOutput("TypeError: boom\n    at x (y.js:1:1)\n")).toBeUndefined();
    expect(parseCheckOutput("[broken\n")).toBeUndefined();
  });
});

describe("checkDiagnostics", () => {
  it("makes each finding a diagnostic with the code stackra explain takes", () => {
    expect(checkDiagnostics(FINDINGS)).toEqual(DIAGNOSTICS);
  });

  it("keeps a bare rule as the code and gives a finding without a phase the check phase", () => {
    expect(checkDiagnostics([{ rule: "missing", severity: "error" }])).toEqual([
      { phase: "check", code: "missing", severity: "error", message: "missing" },
    ]);
  });
});

describe("checkReport", () => {
  it("lists the diagnostics, counts them by phase and severity, and says when there is no report", () => {
    expect(checkReport(`${JSON.stringify(FINDINGS)}\n`)).toEqual({
      report: true,
      counts: {
        lint: { errors: 1, warnings: 0 },
        format: { errors: 0, warnings: 1 },
        structure: { errors: 1, warnings: 0 },
      },
      diagnostics: DIAGNOSTICS,
    });
    expect(checkReport("crashed\n")).toEqual({ report: false, counts: {}, diagnostics: [] });
  });
});
