/**
 * Stackra file contract:
 * Purpose: unit tests of `fakeStorage()`: a real in-memory `Storage`, fresh on every call, that a test seeds through
 *          `store(type)` as the template's tabs layout test does.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0256.
 */
import { describe, expect, it } from "@stackra/testing";

import { Storage } from "#contracts/ports/storage.port";
import { registerStorageKeys } from "#core/index";
import { fakeStorage } from "#testing/functions/fake-storage.function";

class PreferencesStore {
  tenantByUser: Record<string, string> = {};
}

registerStorageKeys([[PreferencesStore, { key: "mobile.preferences" }]]);

describe("fakeStorage", () => {
  it("is an empty Storage", () => {
    const storage = fakeStorage();
    expect(storage).toBeInstanceOf(Storage);
    expect(storage.prefs.keys()).toEqual([]);
  });

  it("takes seeded state through store(type)", async () => {
    const storage = fakeStorage();
    await storage.store(PreferencesStore).write({ tenantByUser: { usr_1: "ten_2" } });
    expect(storage.store(PreferencesStore).read()).toEqual({ tenantByUser: { usr_1: "ten_2" } });
  });

  it("never shares state between calls", () => {
    fakeStorage().prefs.set("a", 1);
    expect(fakeStorage().prefs.has("a")).toBe(false);
  });
});
