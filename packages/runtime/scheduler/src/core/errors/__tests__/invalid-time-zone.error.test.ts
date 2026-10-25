/**
 * Stackra file contract:
 * Purpose: unit tests of `InvalidTimeZoneError`: a Validation refusal that is not retried, with code
 *          `invalid_time_zone` and the time zone as given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidTimeZoneError } from "#core/errors/invalid-time-zone.error";

describe("InvalidTimeZoneError", () => {
  it("is a Validation refusal that is not retried, with code invalid_time_zone and the zone", () => {
    const refused = InvalidTimeZoneError.create({ timeZone: "Mars/Olympus" });
    expect(isRefusal(refused, InvalidTimeZoneError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("invalid_time_zone");
    expect(refused.details).toEqual({ timeZone: "Mars/Olympus" });
  });
});
