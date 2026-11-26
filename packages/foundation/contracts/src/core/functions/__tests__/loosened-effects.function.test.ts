/**
 * Stackra file contract:
 * Purpose: unit tests of `loosenedEffects` and `strictestEffects`: the effects a class loosens below a floor, and the
 *          stricter code per effect of two classes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0540 (decisions 3 and 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { DATA_CLASSIFICATION_EFFECTS } from "#core/constants/data-classification-effects.constant";
import { loosenedEffects } from "#core/functions/loosened-effects.function";
import { strictestEffects } from "#core/functions/strictest-effects.function";
import type { DataClassEffects } from "#core/types/data-class-effects.type";

const health = DATA_CLASSIFICATION_EFFECTS.health;
const personal = DATA_CLASSIFICATION_EFFECTS.personal;
const clinicalNote: DataClassEffects = {
  ai: "never",
  support: "hidden",
  search: "no_snippet",
  export: "labelled",
  encrypt: "subject_sealed",
  erasure: "shred",
  retention: "required",
  mask: "null",
};

describe(loosenedEffects, () => {
  it("names nothing for the floor itself or a stricter class", () => {
    expect(loosenedEffects(health, health)).toEqual([]);
    expect(loosenedEffects(clinicalNote, health)).toEqual([]);
  });

  it("names each effect that ranks below the floor, in effect order", () => {
    expect(loosenedEffects(personal, health)).toEqual([
      "ai",
      "support",
      "search",
      "encrypt",
      "retention",
      "mask",
    ]);
  });

  it("counts a missing or unknown code as loosened", () => {
    const { mask: _mask, ...partial } = health;
    expect(loosenedEffects(partial, health)).toEqual(["mask"]);
    expect(loosenedEffects({ ...health, encrypt: "rot13" }, health)).toEqual(["encrypt"]);
  });

  it("treats delete and shred as equally strict", () => {
    expect(loosenedEffects({ ...clinicalNote, erasure: "delete" }, clinicalNote)).toEqual([]);
  });

  it("refuses a floor holding a code its effect does not rank", () => {
    expect(() => loosenedEffects(health, { ...health, ai: "sometimes" as never })).toThrow(
      RangeError,
    );
  });
});

describe(strictestEffects, () => {
  it("takes the stricter code of each effect", () => {
    expect(strictestEffects(personal, health)).toEqual(health);
    expect(strictestEffects({ ...health, export: "excluded" }, personal)).toEqual({
      ...health,
      export: "excluded",
    });
  });

  it("keeps the first class's code on a tie of rank", () => {
    expect(strictestEffects(clinicalNote, { ...clinicalNote, erasure: "delete" }).erasure).toBe(
      "shred",
    );
    expect(strictestEffects({ ...clinicalNote, erasure: "delete" }, clinicalNote).erasure).toBe(
      "delete",
    );
  });

  it("refuses an unranked code on either side", () => {
    expect(() => strictestEffects({ ...health, mask: "blur" as never }, health)).toThrow(
      RangeError,
    );
    expect(() => strictestEffects(health, { ...health, mask: "blur" as never })).toThrow(
      RangeError,
    );
  });
});
