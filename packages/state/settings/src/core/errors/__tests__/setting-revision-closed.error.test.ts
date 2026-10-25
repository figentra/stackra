/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingRevisionClosedError`: code `setting_revision_closed`, kind Conflict, not retryable, its details on the wire.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0213 (decision 5).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SettingRevisionClosedError } from "#core/errors/setting-revision-closed.error";

describe(SettingRevisionClosedError, () => {
  const refusal = SettingRevisionClosedError.create({
    revision: "rev_1",
    status: "applied" as const,
  });

  it("is a refusal with its derived code and kind", () => {
    expect(isRefusal(refusal, SettingRevisionClosedError)).toBe(true);
    expect(refusal.code).toBe("setting_revision_closed");
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.retryable).toBe(false);
  });

  it("carries its details on the wire", () => {
    expect(refusal.details).toEqual({ revision: "rev_1", status: "applied" as const });
    expect(refusal.toEnvelope()).toMatchObject({ code: "setting_revision_closed" });
  });
});
