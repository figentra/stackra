/**
 * Stackra file contract:
 * Purpose: unit tests of `storageKeyOf`: it returns the registered entry and throws a `TypeError` that names the class
 *          and the fix when gen registered nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { registerStorageKeys } from "#core/functions/register-storage-keys.function";
import { storageKeyOf } from "#core/functions/storage-key-of.function";

class PreferencesStore {}
class UnknownStore {}

describe("storageKeyOf", () => {
  it("returns the registered entry", () => {
    registerStorageKeys([[PreferencesStore, { key: "mobile.preferences" }]]);
    expect(storageKeyOf(PreferencesStore)).toEqual({ key: "mobile.preferences" });
  });

  it("throws for a class gen did not register", () => {
    expect(() => storageKeyOf(UnknownStore)).toThrow(TypeError);
    expect(() => storageKeyOf(UnknownStore)).toThrow(
      /UnknownStore has no storage key: run `stackra gen`/,
    );
  });
});
