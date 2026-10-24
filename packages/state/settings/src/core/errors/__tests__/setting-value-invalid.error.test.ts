/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingValueInvalidError`: code `setting_value_invalid`, a validation refusal (400) that is
 *          not retryable, with the refused keys as details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; final review R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";

describe(SettingValueInvalidError, () => {
  it("is a refusal with its derived code, kind and keys", () => {
    const refusal = SettingValueInvalidError.create({ keys: ["orders.dailyRevenueTargetMinor"] });
    expect(isRefusal(refusal, SettingValueInvalidError)).toBe(true);
    expect(refusal.code).toBe("setting_value_invalid");
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ keys: ["orders.dailyRevenueTargetMinor"] });
  });
});
