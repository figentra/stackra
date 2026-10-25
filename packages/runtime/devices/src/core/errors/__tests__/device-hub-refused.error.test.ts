/**
 * Stackra file contract:
 * Purpose: unit tests of `DeviceHubRefusedError`: kind `Unavailable`, code `device_hub_refused`, retryable, the status
 *          as its one detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140; ADR 0235.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";

describe("DeviceHubRefusedError", () => {
  it("is an unavailable refusal that is retryable", () => {
    const error = DeviceHubRefusedError.create({ status: 503 });
    expect(isRefusal(error, DeviceHubRefusedError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.code).toBe("device_hub_refused");
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ status: 503 });
  });
});
