/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingFourEyesError`: code `setting_four_eyes`, kind Forbidden, not retryable, its details on the wire.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0213 (decision 5).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingFourEyesError } from "#core/errors/setting-four-eyes.error";

describe(SettingFourEyesError, () => {
  const refusal = SettingFourEyesError.create({ revision: "rev_1" });

  it("is a refusal with its derived code and kind", () => {
    expect(isRefusal(refusal, SettingFourEyesError)).toBe(true);
    expect(refusal.code).toBe("setting_four_eyes");
    expect(refusal.kind).toBe(ErrorKind.Forbidden);
    expect(refusal.retryable).toBe(false);
  });

  it("carries its details on the wire", () => {
    expect(refusal.details).toEqual({ revision: "rev_1" });
    expect(refusal.toEnvelope()).toMatchObject({ code: "setting_four_eyes" });
  });
});
