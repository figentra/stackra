/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionCheckFailedError`: a `failed_precondition` refusal, never retryable, whose one
 *          detail is the reason code the template's `check()` raises.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 14); ADR 0140.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionCheckFailedError } from "#core/errors/connection-check-failed.error";

describe("ConnectionCheckFailedError", () => {
  it("carries its reason", () => {
    const error = ConnectionCheckFailedError.create({ reason: "sender_domain_unverified" });
    expect(isRefusal(error, ConnectionCheckFailedError)).toBe(true);
    expect(error).toMatchObject({ reason: "sender_domain_unverified" });
    expect(error.toEnvelope()).toEqual({
      code: "connection_check_failed",
      category: "precondition_failed",
      retryable: false,
      details: { reason: "sender_domain_unverified" },
    });
  });
});
