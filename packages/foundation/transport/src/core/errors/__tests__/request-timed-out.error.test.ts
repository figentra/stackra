/**
 * Stackra file contract:
 * Purpose: unit tests of `RequestTimedOutError`: a retryable refusal of kind `Unavailable` (HTTP 503) with code
 *          `request_timed_out`, whose one detail is the duration, and whose cause stays off the envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140.
 */
import { Duration, Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RequestTimedOutError } from "#core/errors/request-timed-out.error";

describe("RequestTimedOutError", () => {
  it("is an Unavailable refusal with code request_timed_out", () => {
    const refused = RequestTimedOutError.create({ timeout: Duration.seconds(30) });
    expect(isRefusal(refused, RequestTimedOutError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.code).toBe("request_timed_out");
    expect(refused.timeout).toBe("PT30S");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(503);
  });

  it("carries the duration on its envelope and keeps the cause off it", () => {
    const cause = new Error("aborted");
    const refused = RequestTimedOutError.create({ timeout: Duration.seconds(5) }, { cause });
    expect(refused.cause).toBe(cause);
    expect(refused.toEnvelope()).toEqual({
      code: "request_timed_out",
      category: "unavailable",
      retryable: true,
      details: { timeout: "PT5S" },
    });
  });
});
