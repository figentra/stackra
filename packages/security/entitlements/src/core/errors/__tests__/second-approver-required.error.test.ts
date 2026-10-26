/**
 * Stackra file contract:
 * Purpose: unit tests of `SecondApproverRequiredError`: a non-retryable `forbidden` refusal with code `second_approver_required` and its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0391.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SecondApproverRequiredError } from "#core/errors/second-approver-required.error";

describe("SecondApproverRequiredError", () => {
  it("is a forbidden refusal naming the record", () => {
    const error = SecondApproverRequiredError.create({ key: "offer:founding", version: 2 });
    expect(isRefusal(error)).toBe(true);
    expect([error.code, error.kind, error.retryable]).toEqual([
      "second_approver_required",
      ErrorKind.Forbidden,
      false,
    ]);
    expect(error.details).toEqual({ key: "offer:founding", version: 2 });
  });
});
