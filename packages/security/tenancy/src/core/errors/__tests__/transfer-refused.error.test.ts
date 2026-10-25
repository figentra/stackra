/**
 * Stackra file contract:
 * Purpose: unit tests of `TransferRefusedError`: code `transfer_refused`, kind `Forbidden`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TransferRefusedError } from "#core/errors/transfer-refused.error";

describe("TransferRefusedError", () => {
  it("is a non-retryable Forbidden refusal", () => {
    const error = TransferRefusedError.create({ itemKind: "document" });
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("transfer_refused");
    expect(error.kind).toBe(ErrorKind.Forbidden);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ itemKind: "document" });
  });
});
