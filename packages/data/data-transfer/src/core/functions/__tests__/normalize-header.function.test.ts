/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizeHeader`: Arabic diacritics, tatweel, hamza forms, alef maqsura, Arabic-Indic digits,
 *          invisible marks, spacing and case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizeHeader } from "#core/functions/normalize-header.function";

describe("normalizeHeader", () => {
  it("folds Arabic spelling variants", () => {
    expect(normalizeHeader("﻿ الإسـمُ ")).toBe(normalizeHeader("الاسم"));
    expect(normalizeHeader("مستوى")).toBe("مستوي");
    expect(normalizeHeader("‏عنوان ١٢")).toBe("عنوان 12");
    expect(normalizeHeader("رقم ۳")).toBe("رقم 3");
  });

  it("folds spacing, separators and case", () => {
    expect(normalizeHeader("  Unit_Price ")).toBe("unit price");
    expect(normalizeHeader("unit-price")).toBe("unit price");
  });
});
