/**
 * Stackra file contract:
 * Purpose: unit tests of `runEvals`: each case runs in order, passes and failures are named, a throwing subject or
 *          check fails its case only, an empty suite scores 1, and duplicate names are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { runEvals } from "#core/functions/run-evals.function";

describe("runEvals", () => {
  it("reports passes, failures and the score", async () => {
    const report = await runEvals(
      [
        { name: "double", input: 2, check: (out: number) => out === 4 },
        { name: "wrong", input: 3, check: (out: number) => out === 0 },
        { name: "throws", input: -1, check: () => true },
      ],
      (input: number) => {
        if (input < 0) throw new Error("negative");
        return input * 2;
      },
    );
    expect(report).toEqual({ passed: ["double"], failed: ["wrong", "throws"], score: 1 / 3 });
  });

  it("scores an empty suite 1 and refuses duplicate names", async () => {
    expect(await runEvals([], () => 0)).toEqual({ passed: [], failed: [], score: 1 });
    await expect(
      runEvals(
        [
          { name: "a", input: 1, check: () => true },
          { name: "a", input: 2, check: () => true },
        ],
        () => 0,
      ),
    ).rejects.toThrow(RangeError);
  });
});
