/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogWriteFailedError`: a retryable `Unavailable` refusal (HTTP 503) with code
 *          `access_log_write_failed`, no details, and the cause kept off the details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";

describe("AccessLogWriteFailedError", () => {
  it("is a retryable Unavailable refusal with no details", () => {
    const refused = AccessLogWriteFailedError.create();
    expect(isRefusal(refused, AccessLogWriteFailedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.code).toBe("access_log_write_failed");
    expect(refused.retryable).toBe(true);
    expect(refused.details).toEqual({});
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(503);
  });

  it("keeps its cause out of the details", () => {
    const cause = new Error("connection reset");
    const refused = AccessLogWriteFailedError.create({}, { cause });
    expect(refused.cause).toBe(cause);
    expect(refused.details).toEqual({});
  });
});
