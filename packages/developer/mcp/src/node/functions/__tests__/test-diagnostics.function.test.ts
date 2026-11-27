/**
 * Stackra file contract:
 * Purpose: unit tests of `testDiagnostics`: each failed test is an error of phase `test` naming its file, test path and
 *          first error line; a file that failed to load says so; a run without a summary gives none.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (test tiers); STA-2886.
 */
import { describe, expect, it } from "@stackra/testing";

import { testDiagnostics } from "#node/functions/test-diagnostics.function";

describe("testDiagnostics", () => {
  it("makes each failure an error of phase test", () => {
    expect(
      testDiagnostics({
        files: { passed: 1, failed: 2, skipped: 0 },
        tests: { passed: 3, failed: 1, skipped: 0, todo: 0 },
        failures: [
          {
            file: "src/a.test.ts",
            test: "orders > cancels",
            message: "AssertionError: expected 1 to be 2",
          },
          { file: "src/b.test.ts" },
        ],
      }),
    ).toEqual([
      {
        phase: "test",
        severity: "error",
        file: "src/a.test.ts",
        message: "orders > cancels: AssertionError: expected 1 to be 2",
      },
      {
        phase: "test",
        severity: "error",
        file: "src/b.test.ts",
        message: "the file failed to load",
      },
    ]);
  });

  it("gives none for a run without a summary", () => {
    expect(testDiagnostics(undefined)).toEqual([]);
  });
});
