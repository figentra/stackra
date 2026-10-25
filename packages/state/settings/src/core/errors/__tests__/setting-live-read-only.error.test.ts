/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingLiveReadOnlyError`: code `setting_live_read_only`, kind Conflict, not retryable, its details on the wire.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0359 (decision 3).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingLiveReadOnlyError } from "#core/errors/setting-live-read-only.error";

describe(SettingLiveReadOnlyError, () => {
  const refusal = SettingLiveReadOnlyError.create(
    { paths: ["guestCheckout"] },
    { fieldErrors: { guestCheckout: "setting_live_read_only" } },
  );

  it("is a refusal with its derived code and kind", () => {
    expect(isRefusal(refusal, SettingLiveReadOnlyError)).toBe(true);
    expect(refusal.code).toBe("setting_live_read_only");
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.retryable).toBe(false);
  });

  it("carries its details on the wire", () => {
    expect(refusal.details).toEqual({ paths: ["guestCheckout"] });
    expect(refusal.toEnvelope()).toMatchObject({
      code: "setting_live_read_only",
      fieldErrors: { guestCheckout: "setting_live_read_only" },
    });
  });
});
