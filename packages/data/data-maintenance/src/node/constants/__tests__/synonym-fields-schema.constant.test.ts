/**
 * Stackra file contract:
 * Purpose: unit tests of `SYNONYM_FIELDS`: the index and language shapes the search synonym line reads, and two to sixteen
 *          terms with no comma, `#` or line break, trimmed and at most 80 characters.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 5); ADR 0403.
 */
import { describe, expect, it } from "@stackra/testing";

import { SYNONYM_FIELDS } from "#node/constants/synonym-fields-schema.constant";

const VALID = { indexName: "catalogue.products", language: "ar", terms: ["كنبة", " أريكة "] };

describe("SYNONYM_FIELDS", () => {
  it("trims the terms", () => {
    const parsed = SYNONYM_FIELDS.parse(VALID);
    expect(parsed.terms).toEqual(["كنبة", "أريكة"]);
  });

  it("refuses a bad index or language", () => {
    for (const indexName of ["Products", "a.b.c", "1x", ""])
      expect(SYNONYM_FIELDS.safeParse({ ...VALID, indexName }).success).toBe(false);
    for (const language of ["a", "arab", "AR"])
      expect(SYNONYM_FIELDS.safeParse({ ...VALID, language }).success).toBe(false);
  });

  it("refuses too few or too many terms and a term that breaks the line form", () => {
    expect(SYNONYM_FIELDS.safeParse({ ...VALID, terms: ["one"] }).success).toBe(false);
    expect(
      SYNONYM_FIELDS.safeParse({ ...VALID, terms: Array.from({ length: 17 }, (_, i) => `t${i}`) })
        .success,
    ).toBe(false);
    for (const term of ["a,b", "a#b", "a\nb", "", "x".repeat(81)])
      expect(SYNONYM_FIELDS.safeParse({ ...VALID, terms: ["ok", term] }).success).toBe(false);
  });
});
