/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsLockedError`: code `settings_locked`, a conflict (409) that is not retryable, its
 *          paths as details and a field error per path in the envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; final review R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingsLockedError } from "#core/errors/settings-locked.error";

describe(SettingsLockedError, () => {
  const refusal = SettingsLockedError.create(
    { paths: ["cancellation.customersMayCancel"] },
    { fieldErrors: { "cancellation.customersMayCancel": "settings_locked" } },
  );

  it("is a refusal with its derived code and kind", () => {
    expect(isRefusal(refusal, SettingsLockedError)).toBe(true);
    expect(refusal.code).toBe("settings_locked");
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.retryable).toBe(false);
  });

  it("carries its paths and field errors on the wire", () => {
    expect(refusal.details).toEqual({ paths: ["cancellation.customersMayCancel"] });
    expect(refusal.toEnvelope()).toMatchObject({
      code: "settings_locked",
      fieldErrors: { "cancellation.customersMayCancel": "settings_locked" },
    });
  });
});
