/**
 * Stackra file contract:
 * Purpose: unit tests of `ScanPendingError`: code `scan_pending`, an unavailable refusal that is retryable, whose
 *          envelope names the upload to claim again and nothing else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds); ADR 0222.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ScanPendingError } from "#core/errors/scan-pending.error";

describe("ScanPendingError", () => {
  it("is a retryable unavailable refusal naming the upload", () => {
    const refusal = ScanPendingError.create({ upload: "upl_01jd8x0000000000000000000a" });
    expect(refusal.kind).toBe(ErrorKind.Unavailable);
    expect(refusal.toEnvelope()).toEqual({
      code: "scan_pending",
      category: "unavailable",
      retryable: true,
      details: { upload: "upl_01jd8x0000000000000000000a" },
    });
  });
});
