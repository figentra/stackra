/**
 * Stackra file contract:
 * Purpose: unit tests of `TransferLimitExceededError`: kind `validation` (HTTP 400), code `transfer_limit_exceeded`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

describe("TransferLimitExceededError", () => {
  it("is a validation refusal carrying its details", () => {
    const error = TransferLimitExceededError.create({ limit: "rows", max: 10 });
    expect(isRefusal(error, TransferLimitExceededError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
    expect(error.toEnvelope()).toMatchObject({
      code: "transfer_limit_exceeded",
      retryable: false,
      details: { limit: "rows", max: 10 },
    });
  });
});
