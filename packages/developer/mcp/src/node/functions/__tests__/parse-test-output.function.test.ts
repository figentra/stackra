/**
 * Stackra file contract:
 * Purpose: unit tests of `parseTestOutput`: a real Vitest failure report gives its file and test counts, each failed
 *          test with its first error line and a file that failed to load; Turborepo's prefixed lines from several
 *          members add up; output without a Vitest summary is undefined.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182; STA-2873.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseTestOutput } from "#node/functions/parse-test-output.function";

/** Vitest 5's report of one failing test and one file with no suite, as Vitest prints it. */
const VITEST = `
 RUN  v5.0.5 /repo

 ❯ src/b.test.ts (0 test)
 ❯ src/a.test.ts (3 tests | 1 failed | 1 skipped) 11ms
   ❯ suite one (3)
     ✓ passes 2ms
     × fails here 7ms
     ↓ skipped

⎯⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/b.test.ts [ src/b.test.ts ]
Error: No test suite found in file /repo/src/b.test.ts
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/a.test.ts > suite one > fails here
AssertionError: expected 1 to be 2 // Object.is equality

 Test Files  2 failed (2)
      Tests  1 failed | 1 passed | 1 skipped (3)
   Start at  19:02:16
`;

describe("parseTestOutput", () => {
  it("reads the counts and every failure of a Vitest report", () => {
    expect(parseTestOutput(VITEST)).toEqual({
      files: { passed: 0, failed: 2, skipped: 0 },
      tests: { passed: 1, failed: 1, skipped: 1, todo: 0 },
      failures: [
        {
          file: "src/b.test.ts",
          message: "Error: No test suite found in file /repo/src/b.test.ts",
        },
        {
          file: "src/a.test.ts",
          test: "suite one > fails here",
          message: "AssertionError: expected 1 to be 2 // Object.is equality",
        },
      ],
    });
  });

  it("adds up the members Turborepo ran and reports each failure once", () => {
    const output = [
      "@acme/a:test:  FAIL  src/x.spec.tsx > renders",
      "@acme/a:test:  FAIL  src/x.spec.tsx > renders",
      "@acme/a:test:  Test Files  1 failed | 1 passed (2)",
      "@acme/a:test:       Tests  1 failed | 4 passed | 2 todo (7)",
      "@acme/b:test:  Test Files  3 passed | 1 skipped (4)",
      "@acme/b:test:       Tests  12 passed (12)",
    ].join("\n");
    expect(parseTestOutput(output)).toEqual({
      files: { passed: 4, failed: 1, skipped: 1 },
      tests: { passed: 16, failed: 1, skipped: 0, todo: 2 },
      failures: [{ file: "src/x.spec.tsx", test: "renders" }],
    });
  });

  it("is undefined when the run stopped before Vitest printed a summary", () => {
    expect(parseTestOutput("gen: 1 error(s) in .; nothing was written\n")).toBeUndefined();
  });
});
