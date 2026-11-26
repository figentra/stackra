/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentProofWriteFailedError`: code `consent_proof_write_failed`, kind `unavailable`,
 *          retryable, no details, the cause kept.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; STA-2818.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConsentProofWriteFailedError } from "#core/errors/consent-proof-write-failed.error";

describe("ConsentProofWriteFailedError", () => {
  it("is a retryable unavailable refusal with no details", () => {
    const cause = new Error("duplicate key");
    const error = ConsentProofWriteFailedError.create({}, { cause });
    expect(isRefusal(error, ConsentProofWriteFailedError)).toBe(true);
    expect(error.code).toBe("consent_proof_write_failed");
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({});
    expect(error.cause).toBe(cause);
  });
});
