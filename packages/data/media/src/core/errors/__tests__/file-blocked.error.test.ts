/**
 * Stackra file contract:
 * Purpose: unit tests of `FileBlockedError`: code `file_blocked`, a precondition refusal that is not retryable, whose
 *          envelope names the reason only.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds); ADR 0222.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FileBlockedError } from "#core/errors/file-blocked.error";

describe("FileBlockedError", () => {
  it("is a precondition refusal naming the reason", () => {
    const refusal = FileBlockedError.create({ reason: "malware" });
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.toEnvelope()).toEqual({
      code: "file_blocked",
      category: "precondition_failed",
      retryable: false,
      details: { reason: "malware" },
    });
  });
});
