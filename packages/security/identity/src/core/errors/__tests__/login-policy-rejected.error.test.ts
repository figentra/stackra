/**
 * Stackra file contract:
 * Purpose: unit tests of `LoginPolicyRejectedError`: kind `Validation`, retryable false, carrying the broken rule as
 *          its `reason` and nothing else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; STA-2817.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LoginPolicyRejection } from "#contracts/index";
import { LoginPolicyRejectedError } from "#core/errors/login-policy-rejected.error";

describe("LoginPolicyRejectedError", () => {
  it("is a Validation refusal with its reason", () => {
    const error = LoginPolicyRejectedError.create({ reason: LoginPolicyRejection.NoSecondFactor });
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("login_policy_rejected");
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ reason: "no_second_factor" });
  });
});
