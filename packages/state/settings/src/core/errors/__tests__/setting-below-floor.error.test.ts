/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingBelowFloorError`: code `setting_below_floor`, kind Validation, not retryable, its details on the wire.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0370 (decision 6).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingBelowFloorError } from "#core/errors/setting-below-floor.error";

describe(SettingBelowFloorError, () => {
  const refusal = SettingBelowFloorError.create(
    { floors: [{ path: "refundWindowDays", law: "EU 2011/83", market: "eu" }] },
    { fieldErrors: { refundWindowDays: "setting_below_floor" } },
  );

  it("is a refusal with its derived code and kind", () => {
    expect(isRefusal(refusal, SettingBelowFloorError)).toBe(true);
    expect(refusal.code).toBe("setting_below_floor");
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.retryable).toBe(false);
  });

  it("carries its details on the wire", () => {
    expect(refusal.details).toEqual({
      floors: [{ path: "refundWindowDays", law: "EU 2011/83", market: "eu" }],
    });
    expect(refusal.toEnvelope()).toMatchObject({
      code: "setting_below_floor",
      fieldErrors: { refundWindowDays: "setting_below_floor" },
    });
  });
});
