/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditExportFailedError`: a retryable `Unavailable` refusal (HTTP 503) with code
 *          `audit_export_failed`, no details, and the cause kept off the details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328; STA-1579.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AuditExportFailedError } from "#core/errors/audit-export-failed.error";

describe("AuditExportFailedError", () => {
  it("is a retryable Unavailable refusal with no details", () => {
    const cause = new Error("HTTP 502");
    const refused = AuditExportFailedError.create({}, { cause });
    expect(isRefusal(refused, AuditExportFailedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.code).toBe("audit_export_failed");
    expect(refused.retryable).toBe(true);
    expect(refused.details).toEqual({});
    expect(refused.cause).toBe(cause);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(503);
  });
});
