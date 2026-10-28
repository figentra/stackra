/**
 * Stackra file contract:
 * Purpose: unit tests of `AppendOnlyWriteError`: a `failed_precondition` refusal with the code `append_only_write`
 *          that names the model and the refused write.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0134; ADR 0220; ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AppendOnlyWriteError } from "#core/errors/append-only-write.error";

describe("AppendOnlyWriteError", () => {
  it("is a failed-precondition refusal naming the model and the write", () => {
    const error = AppendOnlyWriteError.create({ model: "LedgerEntry", operation: "update" });
    expect(isRefusal(error, AppendOnlyWriteError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.toEnvelope()).toMatchObject({
      code: "append_only_write",
      details: { model: "LedgerEntry", operation: "update" },
    });
  });
});
