/**
 * Stackra file contract:
 * Purpose: unit tests of `MalformedEdiError`: a `validation` refusal, never retryable, naming the syntax and reason.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0447 (decision 4).
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MalformedEdiError } from "#core/edi/malformed-edi.error";

describe("MalformedEdiError", () => {
  it("names the syntax and the reason", () => {
    const error = MalformedEdiError.create({ syntax: "x12", reason: "no IEA trailer" });
    expect(isRefusal(error, MalformedEdiError)).toBe(true);
    expect(error.code).toBe("malformed_edi");
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ syntax: "x12", reason: "no IEA trailer" });
  });
});
