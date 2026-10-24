/**
 * Stackra file contract:
 * Purpose: unit tests of `ProviderUnavailableError`: an `unavailable` refusal (HTTP 503), retryable, carrying the
 *          provider, as the template's poison-message test builds it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 13); ADR 0140; ADR 0148.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";

describe("ProviderUnavailableError", () => {
  it("is a retryable unavailable refusal carrying the provider", () => {
    const error = ProviderUnavailableError.create({ provider: "resend" });
    expect(isRefusal(error, ProviderUnavailableError)).toBe(true);
    expect(error.retryable).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(503);
    expect(error.toEnvelope()).toEqual({
      code: "provider_unavailable",
      category: "unavailable",
      retryable: true,
      details: { provider: "resend" },
    });
  });

  it("carries the last status and the wait a bucket asked for", () => {
    expect(ProviderUnavailableError.create({ provider: "resend", status: 503 }).details).toEqual({
      provider: "resend",
      status: 503,
    });
    expect(
      ProviderUnavailableError.create({ provider: "resend", retryAfterMs: 1200 }).retryAfterMs,
    ).toBe(1200);
  });
});
