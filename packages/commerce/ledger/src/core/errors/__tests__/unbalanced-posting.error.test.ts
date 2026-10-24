/**
 * Stackra file contract:
 * Purpose: unit tests of `UnbalancedPostingError`: a `failed_precondition` refusal with the code `unbalanced_posting`
 *          that carries the line count and the lines' sum.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0220 (decision 4); ADR 0140; ADR 0328; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnbalancedPostingError } from "#core/errors/unbalanced-posting.error";

describe("UnbalancedPostingError", () => {
  it("is a failed-precondition refusal carrying the lines and their sum", () => {
    const error = UnbalancedPostingError.create({ lines: 2, total: -10 });

    expect(isRefusal(error, UnbalancedPostingError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.retryable).toBe(false);
    expect(error.toEnvelope()).toMatchObject({
      code: "unbalanced_posting",
      details: { lines: 2, total: -10 },
    });
  });
});
