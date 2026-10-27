/**
 * Stackra file contract:
 * Purpose: the contract of the `.` entry: the registry row's primitives, the pure evaluation (`resolvePrice`,
 *          `evaluateFormula`, `taxByRates`), `PriceKind` and the tax memory and connection drivers
 *          are exported, nothing else, and they
 *          compose with `@stackra/money`.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import { Rounding } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";
import type { PriceTier } from "#core/index";

describe("@stackra/pricing", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "BILLING_PACK_KEYS",
      "BillingPeriod",
      "ConnectionTaxProviderDriver",
      "GraduatedPrice",
      "MemoryTaxProviderDriver",
      "OfferBenefitKind",
      "PriceKind",
      "PricePoint",
      "applyOffers",
      "billingTermsOf",
      "evaluateFormula",
      "isCatalogueDiscount",
      "meterCharge",
      "offerEligible",
      "offerOf",
      "planPrice",
      "planPriceListsOf",
      "priceListKey",
      "rateCardOf",
      "resolvePrice",
      "stackOffers",
      "taxByRates",
    ]);
  });

  it("prices usage and rounds an adjusted list price onto a point", () => {
    const band: PriceTier = { upTo: null, unitPrice: Money.ofMinor(150, "USD") };
    const usage = entry.GraduatedPrice.of([band]).total(4);
    const adjusted = usage.times(0.8, Rounding.HalfEven); // a purchasing-power price list
    expect(entry.PricePoint.ofMinor(100, 99, "USD").apply(adjusted).toDecimal()).toBe("4.99");
  });
});
