/**
 * Stackra file contract:
 * Purpose: unit tests of `BUILT_IN_DATA_CLASSES`: one frozen row per built-in class of @stackra/model, each with its key
 *          and the eight effects in ranked codes; the credential row is the `credential` classification's.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0540 (decision 7); ADR 0494.
 */
import { describe, expect, it } from "@stackra/testing";

import { BUILT_IN_DATA_CLASS_PACKAGE } from "#core/constants/built-in-data-class-package.constant";
import { BUILT_IN_DATA_CLASSES } from "#core/constants/built-in-data-classes.constant";
import { DATA_CLASS_EFFECT_RANKS } from "#core/constants/data-class-effect-ranks.constant";
import { DATA_CLASSIFICATION_EFFECTS } from "#core/constants/data-classification-effects.constant";

describe("BUILT_IN_DATA_CLASSES", () => {
  it("names the package its classes come from", () => {
    expect(BUILT_IN_DATA_CLASS_PACKAGE).toBe("@stackra/model");
  });

  it("holds a frozen row per built-in class, each with its key and the eight effects in ranked codes", () => {
    expect(Object.keys(BUILT_IN_DATA_CLASSES)).toEqual([
      "CredentialDataClass",
      "PrivilegedDataClass",
    ]);
    expect(Object.isFrozen(BUILT_IN_DATA_CLASSES)).toBe(true);
    for (const { key, ...effects } of Object.values(BUILT_IN_DATA_CLASSES)) {
      expect(typeof key).toBe("string");
      expect(Object.keys(effects)).toEqual(Object.keys(DATA_CLASS_EFFECT_RANKS));
      for (const [effect, code] of Object.entries(effects))
        expect(
          Object.keys(DATA_CLASS_EFFECT_RANKS[effect as keyof typeof DATA_CLASS_EFFECT_RANKS]),
        ).toContain(code);
    }
  });

  it("states the credential class as the credential classification's row", () => {
    expect(BUILT_IN_DATA_CLASSES.CredentialDataClass).toEqual({
      key: "credential",
      ...DATA_CLASSIFICATION_EFFECTS.credential,
    });
  });

  it("keeps a privileged field out of erasure and out of a masked copy", () => {
    const { erasure, mask } = BUILT_IN_DATA_CLASSES.PrivilegedDataClass;
    expect([erasure, mask]).toEqual(["keep", "null"]);
  });
});
