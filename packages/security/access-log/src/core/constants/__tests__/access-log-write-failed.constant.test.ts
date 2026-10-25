/**
 * Stackra file contract:
 * Purpose: unit tests of `ACCESS_LOG_WRITE_FAILED`: the snake_case log event, equal to the refusal's code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231 (machine codes).
 */
import { describe, expect, it } from "@stackra/testing";

import { ACCESS_LOG_WRITE_FAILED } from "#core/constants/access-log-write-failed.constant";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";

describe("ACCESS_LOG_WRITE_FAILED", () => {
  it("is the refusal's code", () => {
    expect(ACCESS_LOG_WRITE_FAILED).toBe("access_log_write_failed");
    expect(AccessLogWriteFailedError.create().code).toBe(ACCESS_LOG_WRITE_FAILED);
  });
});
