/**
 * Stackra file contract:
 * Purpose: unit tests of `parseCheckOutput` and `checkReport`: the JSON report that ends a check run is read past the
 *          phase notices before it, an empty report is no findings, the counts are by phase and severity, and output
 *          without a report is undefined (null in the report), never a clean run.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 3); STA-2873.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkReport } from "#node/functions/check-report.function";
import { parseCheckOutput } from "#node/functions/parse-check-output.function";

const FINDINGS = [
  {
    phase: "lint",
    rule: "eslint(no-debugger)",
    path: "a.ts",
    line: 3,
    severity: "error",
    tags: ["x"],
  },
  { phase: "lint", rule: "eslint(no-console)", path: "b.ts", line: 1, severity: "warning" },
  { phase: "spec", rule: "missing", path: ".", line: null, severity: "error" },
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

describe("checkReport", () => {
  it("counts the findings by phase and severity, and says null when there is no report", () => {
    expect(checkReport(`${JSON.stringify(FINDINGS)}\n`)).toEqual({
      findings: FINDINGS,
      counts: { lint: { errors: 1, warnings: 1 }, spec: { errors: 1, warnings: 0 } },
    });
    expect(checkReport("crashed\n")).toEqual({ findings: null, counts: {} });
  });
});
