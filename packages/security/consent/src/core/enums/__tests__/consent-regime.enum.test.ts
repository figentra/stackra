/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentRegime`: opt-out `ccpa` and the opt-in `gdpr`, `lgpd`, `pdpl_sa`, `pdpl_ae` and
 *          `dpdp`, each labelled in all seven locales.
 * Boundary: test only; reads the catalogues in assets/lang.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0298 (decision 4).
 */
import { readFileSync } from "node:fs";

import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConsentRegime } from "#core/enums/consent-regime.enum";

/** The `consent_regime` labels of one locale's catalogue in assets/lang. */
const labelsOf = (locale: string): Record<string, string> =>
  (
    JSON.parse(
      readFileSync(
        new URL(`../../../../assets/lang/${locale}/consent.json`, import.meta.url),
        "utf8",
      ),
    ) as { enums: { consent_regime: Record<string, string> } }
  ).enums.consent_regime;

describe("ConsentRegime", () => {
  it("lists the regimes in order", () => {
    expect(Enum.values(ConsentRegime)).toEqual([
      "gdpr",
      "ccpa",
      "lgpd",
      "pdpl_sa",
      "pdpl_ae",
      "dpdp",
    ]);
    expectTypeOf<ConsentRegime>().toEqualTypeOf<
      "gdpr" | "ccpa" | "lgpd" | "pdpl_sa" | "pdpl_ae" | "dpdp"
    >();
  });

  it("labels every code in all seven locales", () => {
    for (const labels of ["ar", "de", "en", "es", "fr", "it", "nl"].map(labelsOf)) {
      expect(Object.keys(labels).sort()).toEqual([...Enum.values(ConsentRegime)].sort());
    }
  });
});
