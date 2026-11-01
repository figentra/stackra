/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalSettingsUnavailableError`: an `Unavailable` refusal with code
 *          `approval_settings_unavailable`, not retryable.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalSettingsUnavailableError } from "#core/errors/approval-settings-unavailable.error";

describe("ApprovalSettingsUnavailableError", () => {
  it("is approval_settings_unavailable, an unavailable kind that is not retryable", () => {
    const refused = ApprovalSettingsUnavailableError.create();
    expect(isRefusal(refused, ApprovalSettingsUnavailableError)).toBe(true);
    expect(refused.code).toBe("approval_settings_unavailable");
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.retryable).toBe(false);
  });
});
