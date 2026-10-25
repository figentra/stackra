/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceUnauthorizedError`: kind `Unauthenticated`, code `device_unauthorized`, not retryable,
 *          the status as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140; ADR 0235.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DeviceUnauthorizedError } from "#core/errors/device-unauthorized.error";

describe("DeviceUnauthorizedError", () => {
  it("is an unauthenticated refusal that is not retryable", () => {
    const error = DeviceUnauthorizedError.create({ status: 401 });
    expect(isRefusal(error, DeviceUnauthorizedError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.code).toBe("device_unauthorized");
    expect(error.retryable).toBe(false);
    expect(error.toEnvelope()).toEqual({
      code: "device_unauthorized",
      category: "unauthenticated",
      retryable: false,
      details: { status: 401 },
    });
  });
});
