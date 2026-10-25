/**
 * Stackra file contract:
 * Purpose: unit tests of `toDeadLetter`: it passes for a dead-lettered `runJob` result, checks the attempts only when
 *          asked, fails for any other outcome or a different attempt count, and inverts with `.not`.
 * Boundary: test only; results are built by hand, so no app runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0148 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { JobOutcome } from "#core/index";
import { toDeadLetter } from "#testing/to-dead-letter.matcher";
import type { JobResult } from "#testing/types/job-result.type";

/** A result that ended with `outcome` after `attempts` attempts. */
const resultOf = (outcome: JobOutcome, attempts: number): JobResult<unknown> => ({
  id: "job_a",
  outcome,
  attempts,
  output: undefined,
  error: undefined,
  runs: [],
});

describe(toDeadLetter, () => {
  it("passes for a dead-lettered job, with or without its attempts", () => {
    expect(resultOf(JobOutcome.DeadLettered, 6)).toDeadLetter();
    expect(resultOf(JobOutcome.DeadLettered, 6)).toDeadLetter({ attempts: 6 });
  });

  it("fails for another outcome or another attempt count", () => {
    expect(resultOf(JobOutcome.Done, 1)).not.toDeadLetter();
    expect(resultOf(JobOutcome.Dropped, 6)).not.toDeadLetter();
    expect(() =>
      expect(resultOf(JobOutcome.DeadLettered, 3)).toDeadLetter({ attempts: 6 }),
    ).toThrow(/dead-lettered after 6 attempts/);
  });
});
