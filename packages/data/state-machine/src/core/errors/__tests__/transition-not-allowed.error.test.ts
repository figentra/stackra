/**
 * Stackra file contract:
 * Purpose: unit tests of `TransitionNotAllowedError`: kind `conflict` (HTTP 409), code `transition_not_allowed`, not
 *          retryable, with the transition and the record's state as its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0161 (0294 note); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TransitionNotAllowedError } from "#core/errors/transition-not-allowed.error";

describe("TransitionNotAllowedError", () => {
  it("is a conflict refusal carrying the transition and the state", () => {
    const error = TransitionNotAllowedError.create({ transition: "cancel", state: "paid" });
    expect(isRefusal(error, TransitionNotAllowedError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Conflict);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(409);
    expect(error.toEnvelope()).toEqual({
      code: "transition_not_allowed",
      category: "conflict",
      retryable: false,
      details: { transition: "cancel", state: "paid" },
    });
  });
});
