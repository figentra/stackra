/**
 * Stackra file contract:
 * Purpose: unit tests of `ProviderRefusedError`: a `failed_precondition` refusal, never retryable, built from the
 *          provider's status and error code as the template writes it (`create({ status, code })`), matched by `is`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 13); ADR 0140; R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ProviderRefusedError } from "#core/errors/provider-refused.error";

describe("ProviderRefusedError", () => {
  it("keeps the provider's code as providerCode and its own code derived", () => {
    const error = ProviderRefusedError.create({ status: 401, code: "restricted_api_key" });
    expect(error).toBeInstanceOf(ProviderRefusedError);
    expect(isRefusal(error, ProviderRefusedError)).toBe(true);
    expect(error.code).toBe("provider_refused");
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.retryable).toBe(false);
    expect(error.toEnvelope()).toEqual({
      code: "provider_refused",
      category: "precondition_failed",
      retryable: false,
      details: { status: 401, providerCode: "restricted_api_key" },
    });
  });

  it("takes the declared details too, and a cause", () => {
    const cause = new Error("socket closed");
    const error = ProviderRefusedError.create({ provider: "resend", status: 422 }, { cause });
    expect(error.details).toEqual({ provider: "resend", status: 422 });
    expect(error.cause).toBe(cause);
  });

  it("matches by status and provider code", () => {
    const error = ProviderRefusedError.create({ status: 401, code: "restricted_api_key" });
    expect(ProviderRefusedError.is(error)).toBe(true);
    expect(ProviderRefusedError.is(error, { status: 401, code: "restricted_api_key" })).toBe(true);
    expect(ProviderRefusedError.is(error, { status: 403 })).toBe(false);
    expect(ProviderRefusedError.is(error, { code: "invalid_api_key" })).toBe(false);
    expect(ProviderRefusedError.is(new Error("x"), { status: 401 })).toBe(false);
  });

  it("requires the status", () => {
    // @ts-expect-error -- `status` is required
    expect(() => ProviderRefusedError.create({ code: "x" })).not.toThrow();
  });
});
