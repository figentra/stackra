/**
 * Stackra file contract:
 * Purpose: unit tests of `formatFinding`, `summaryTable`, `isAffected`, `toolFinding` and `exitFinding`: the printed
 *          finding line in text and GitHub form, the padded summary, the affected scope and the finding defaults.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { exitFinding } from "#node/functions/exit-finding.function";
import { formatFinding } from "#node/functions/format-finding.function";
import { isAffected } from "#node/functions/is-affected.function";
import { summaryTable } from "#node/functions/summary-table.function";
import { toolFinding } from "#node/functions/tool-finding.function";

const PHASE = { name: "lint", tool: "oxlint", adr: "0129" };

describe("finding output", () => {
  it("toolFinding fills the phase, tool and ADR, and reads an ADR from the message", () => {
    expect(toolFinding(PHASE, { rule: "r", message: "bad" })).toEqual({
      phase: "lint",
      tool: "oxlint",
      rule: "r",
      path: ".",
      line: null,
      column: null,
      message: "bad",
      severity: "error",
      fixable: false,
      adr: "0129",
    });
    expect(toolFinding(PHASE, { rule: "r", message: "see ADR 0022" }).adr).toBe("0022");
  });

  it("exitFinding names the exit code and the tool's last line", () => {
    expect(
      exitFinding(PHASE, { code: 2, stdout: "", stderr: "first\nconfig missing\n" }).message,
    ).toBe("oxlint exited 2: config missing");
    expect(exitFinding(PHASE, { code: 3, stdout: "", stderr: "" }).message).toBe("oxlint exited 3");
  });

  it("prints path:line:col, tool/rule, message and the marks in text form", () => {
    const finding = toolFinding(PHASE, {
      rule: "eslint(no-debugger)",
      path: "a.ts",
      line: 3,
      column: 5,
      message: "no debugger",
      fixable: true,
    });
    expect(formatFinding(finding, "text")).toBe(
      "a.ts:3:5  oxlint/eslint(no-debugger)  no debugger  [fixable]",
    );
    expect(
      formatFinding(
        toolFinding(PHASE, { rule: "r", path: "b.ts", message: "m", severity: "warning" }),
        "text",
      ),
    ).toBe("b.ts  oxlint/r  m  [warning]");
  });

  it("prints a GitHub annotation with escaped properties and message", () => {
    const finding = toolFinding(PHASE, {
      rule: "a:b",
      path: "x,y.ts",
      line: 1,
      message: "50%\nnext",
    });
    expect(formatFinding(finding, "github")).toBe(
      "::error file=x%2Cy.ts,line=1,title=oxlint/a%3Ab::50%25%0Anext",
    );
  });

  it("pads the summary table into columns", () => {
    expect(
      summaryTable([
        { phase: "config", status: "passed", findings: 0, fixable: 0, ms: 120 },
        { phase: "spelling", status: "skipped (not installed)", findings: 0, fixable: 0, ms: 0 },
      ]),
    ).toBe(
      [
        "phase     status                   findings  fixable  duration",
        "config    passed                   0         0        0.1s",
        "spelling  skipped (not installed)  0         0        0.0s",
        "",
      ].join("\n"),
    );
  });

  it("isAffected keeps the file, the member holding it, and the repository", () => {
    const files = ["packages/x/src/a.ts"];
    expect(isAffected("packages/x/src/a.ts", files)).toBe(true);
    expect(isAffected("packages/x", files)).toBe(true);
    expect(isAffected(".", files)).toBe(true);
    expect(isAffected("packages/y", files)).toBe(false);
    expect(isAffected("packages/x/src/b.ts", files)).toBe(false);
  });
});
