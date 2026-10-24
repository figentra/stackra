/**
 * Stackra file contract:
 * Purpose: unit tests of `AppDrainingError`: a retryable `unavailable` refusal with the derived code `app_draining`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AppDrainingError } from "#server/errors/app-draining.error";

describe("AppDrainingError", () => {
  it("is a retryable unavailable refusal coded app_draining", () => {
    const error = AppDrainingError.create();
    expect(isRefusal(error, AppDrainingError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.code).toBe("app_draining");
    expect(error.retryable).toBe(true);
  });
});
