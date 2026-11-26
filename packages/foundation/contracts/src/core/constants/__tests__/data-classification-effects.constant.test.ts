/**
 * Stackra file contract:
 * Purpose: unit tests of `DATA_CLASSIFICATION_EFFECTS` and `DATA_CLASS_EFFECT_RANKS`: a row for every classification
 *          with every effect, each code ranked, the safety floors of ADR 0494 and ADR 0540 fixed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0540; ADR 0494.
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { DATA_CLASS_EFFECT_RANKS } from "#core/constants/data-class-effect-ranks.constant";
import { DATA_CLASSIFICATION_EFFECTS } from "#core/constants/data-classification-effects.constant";
import { DataClassification } from "#core/enums/data-classification.enum";

const EFFECTS = ["ai", "support", "search", "export", "encrypt", "erasure", "retention", "mask"];

describe("DATA_CLASSIFICATION_EFFECTS", () => {
  it("holds one frozen row per classification, each with the eight effects", () => {
    expect(Object.keys(DATA_CLASSIFICATION_EFFECTS)).toEqual(Enum.values(DataClassification));
    expect(Object.isFrozen(DATA_CLASSIFICATION_EFFECTS)).toBe(true);
    for (const row of Object.values(DATA_CLASSIFICATION_EFFECTS)) {
      expect(Object.keys(row)).toEqual(EFFECTS);
      expect(Object.isFrozen(row)).toBe(true);
    }
  });

  it("writes only ranked codes", () => {
    for (const row of Object.values(DATA_CLASSIFICATION_EFFECTS))
      for (const [effect, code] of Object.entries(row))
        expect(Object.keys(DATA_CLASS_EFFECT_RANKS[effect as keyof typeof row])).toContain(code);
  });

  it("keeps a credential out of every reader, sealed, and out of a subject's erasure (ADR 0494)", () => {
    expect(DATA_CLASSIFICATION_EFFECTS.credential).toEqual({
      ai: "never",
      support: "hidden",
      search: "no_snippet",
      export: "excluded",
      encrypt: "sealed",
      erasure: "keep",
      retention: "none",
      mask: "null",
    });
  });

  it("seals health data, bounds its retention and never copies it into a masked environment", () => {
    const { health } = DATA_CLASSIFICATION_EFFECTS;
    expect([health.encrypt, health.retention, health.mask]).toEqual(["sealed", "required", "null"]);
  });

  it("erases every personal class with its subject, and keeps a pseudonymous id joinable in a masked copy", () => {
    for (const code of ["personal", "financial", "health", "pseudonymous", "regulated"] as const)
      expect(DATA_CLASSIFICATION_EFFECTS[code].erasure).toBe("anonymise");
    expect(DATA_CLASSIFICATION_EFFECTS.pseudonymous.mask).toBe("hash");
  });
});

describe("DATA_CLASS_EFFECT_RANKS", () => {
  it("ranks the eight effects, loosest first", () => {
    expect(Object.keys(DATA_CLASS_EFFECT_RANKS)).toEqual(EFFECTS);
    expect(DATA_CLASS_EFFECT_RANKS.ai).toEqual({ allowed: 0, tenant_opt_in: 1, never: 2 });
    expect(DATA_CLASS_EFFECT_RANKS.encrypt).toEqual({ clear: 0, sealed: 1, subject_sealed: 2 });
    expect(DATA_CLASS_EFFECT_RANKS.erasure).toEqual({ keep: 0, anonymise: 1, delete: 2, shred: 2 });
    expect(DATA_CLASS_EFFECT_RANKS.mask).toEqual({ keep: 0, hash: 1, fake: 2, null: 3 });
  });
});
