/**
 * Stackra file contract:
 * Purpose: unit tests of `refuseLockedPaths`: silent when no written path is locked above, and a `settings_locked`
 *          refusal naming exactly the locked written paths, each with its field error, otherwise.
 * Boundary: test only; pure apart from the throw.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { SettingsLockedError } from "#core/errors/settings-locked.error";
import { refuseLockedPaths } from "#core/functions/refuse-locked-paths.function";

const ABOVE = [
  { values: { a: 1 }, locked: ["a"] },
  { values: {}, locked: ["c"] },
];

describe("refuseLockedPaths", () => {
  it("passes a write of unlocked paths", () => {
    expect(() => refuseLockedPaths(ABOVE, ["b"])).not.toThrow();
    expect(() => refuseLockedPaths([], ["a"])).not.toThrow();
  });

  it("refuses the locked written paths", () => {
    try {
      refuseLockedPaths(ABOVE, ["a", "b", "c"]);
      expect.unreachable("a locked path must refuse");
    } catch (error) {
      expect(error).toBeInstanceOf(SettingsLockedError);
      expect((error as SettingsLockedError).paths).toEqual(["a", "c"]);
      expect((error as SettingsLockedError).fieldErrors).toEqual({
        a: "settings_locked",
        c: "settings_locked",
      });
    }
  });
});
