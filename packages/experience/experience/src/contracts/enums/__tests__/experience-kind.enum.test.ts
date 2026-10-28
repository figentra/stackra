/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ExperienceKind`: an `Enum.of` enum of the six document kinds, codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0270 (decisions 6 and 7);
 *                     STA-1383 (Dashboard added: one document-kind vocabulary).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";

describe("ExperienceKind", () => {
  it("holds the seven kinds in order", () => {
    expect(Enum.values(ExperienceKind)).toEqual([
      "page",
      "screen",
      "form",
      "email_template",
      "print_document",
      "theme_section",
      "dashboard",
    ]);
  });

  it("types its values", () => {
    expectTypeOf<ExperienceKind>().toEqualTypeOf<
      | "page"
      | "screen"
      | "form"
      | "email_template"
      | "print_document"
      | "theme_section"
      | "dashboard"
    >();
  });
});
