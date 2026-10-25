/**
 * Stackra file contract:
 * Purpose: unit tests of `RootBlockLockedError`: a refusal of kind `FailedPrecondition` with code `root_block_locked`
 *          (HTTP 412), not retryable, with no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RootBlockLockedError } from "#core/errors/root-block-locked.error";

describe("RootBlockLockedError", () => {
  it("is a FailedPrecondition refusal with code root_block_locked", () => {
    const refused = RootBlockLockedError.create();
    expect(isRefusal(refused, RootBlockLockedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("root_block_locked");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });
});
