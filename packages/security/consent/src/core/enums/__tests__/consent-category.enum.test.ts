/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentCategory`: the three codes in order, which the lang files label and the template's
 *          analytics and telemetry configurations name.
 * Boundary: test only; also checks every code has an English and an Arabic label in assets/lang.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 16 and 20); ADR 0298.
 */
import { readFileSync } from "node:fs";

import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConsentCategory } from "#core/enums/consent-category.enum";

/** The `consent_category` labels of one locale's catalogue in assets/lang. */
const labelsOf = (locale: string): Record<string, string> =>
  (
    JSON.parse(
      readFileSync(
        new URL(`../../../../assets/lang/${locale}/consent.json`, import.meta.url),
        "utf8",
      ),
    ) as { enums: { consent_category: Record<string, string> } }
  ).enums.consent_category;

describe("ConsentCategory", () => {
  it("lists the categories in order", () => {
    expect(Enum.values(ConsentCategory)).toEqual([
      "necessary",
      "analytics",
      "crash_replay",
      "marketing",
    ]);
    expect(ConsentCategory.CrashReplay).toBe("crash_replay");
    expect(ConsentCategory.Marketing).toBe("marketing");
    expectTypeOf<ConsentCategory>().toEqualTypeOf<
      "necessary" | "analytics" | "crash_replay" | "marketing"
    >();
  });

  it("labels every code in all seven locales", () => {
    for (const labels of ["ar", "de", "en", "es", "fr", "it", "nl"].map(labelsOf)) {
      expect(Object.keys(labels).sort()).toEqual([...Enum.values(ConsentCategory)].sort());
    }
  });
});
