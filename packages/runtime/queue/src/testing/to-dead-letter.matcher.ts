/**
 * Stackra file contract:
 * Purpose: `toDeadLetter`, the matcher that checks a job ran to the dead-letter queue: `expect(job).toDeadLetter()` for a
 *          `runJob` result, with `{ attempts }` to check how many attempts it had first.
 * Boundary: reads the result's `outcome` and `attempts` only, never the error text. Registered with `expect` when this
 *           entry is imported.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0148 (decision 1: the dead-letter queue).
 */
import { createMatcher } from "@stackra/testing";

import { JobOutcome } from "#core/index";
import type { JobResult } from "#testing/types/job-result.type";

/** Passes when `received` was dead-lettered, after exactly `expected.attempts` attempts when that is given. */
export const toDeadLetter = createMatcher(
  "toDeadLetter",
  (received: JobResult<unknown>, expected: { readonly attempts?: number } = {}) => {
    const pass =
      received?.outcome === JobOutcome.DeadLettered &&
      (expected.attempts === undefined || received.attempts === expected.attempts);
    const after = expected.attempts === undefined ? "" : ` after ${expected.attempts} attempts`;
    return {
      pass,
      message: () =>
        `expected the job ${pass ? "not " : ""}to be dead-lettered${after}, ` +
        `but it ended ${String(received?.outcome)} after ${String(received?.attempts)} attempts`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts a `runJob` result was dead-lettered, after `attempts` attempts when given. */
    toDeadLetter: (expected?: { readonly attempts?: number }) => R;
  }
}
