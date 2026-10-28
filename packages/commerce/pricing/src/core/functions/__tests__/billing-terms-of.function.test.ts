/**
 * Stackra file contract:
 * Purpose: unit tests of `billingTermsOf`: price and collection currencies are read separately, a rate source is required only when they differ, and the invoice series follows the dated billing seller.
 * Boundary: test only; rows and pack values are test data standing in for seed-pack and market-pack records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0392.
 */
import { describe, expect, it } from "@stackra/testing";

import { BILLING_PACK_KEYS } from "#core/constants/billing-pack-keys.constant";
import { billingTermsOf } from "#core/functions/billing-terms-of.function";

/** Pack values as `valuesOn` returns them. */
function values(
  entries: Record<string, unknown>,
): ReadonlyMap<string, { readonly value: unknown }> {
  return new Map(Object.entries(entries).map(([key, value]) => [key, { value }]));
}

const EG = {
  [BILLING_PACK_KEYS.regionalTier]: "low",
  [BILLING_PACK_KEYS.priceCurrency]: "USD",
  [BILLING_PACK_KEYS.collectionCurrency]: "EGP",
  [BILLING_PACK_KEYS.rateSource]: "central_bank",
  [BILLING_PACK_KEYS.contractingEntity]: "entity-a",
  [BILLING_PACK_KEYS.billingSeller]: "entity-a",
};

const without = (key: string) =>
  Object.fromEntries(Object.entries(EG).filter(([held]) => held !== key));

describe("billingTermsOf", () => {
  it("keeps price and collection currency apart", () => {
    expect(billingTermsOf(values(EG), "eg")).toEqual({
      regionalTier: "low",
      priceCurrency: "USD",
      collectionCurrency: "EGP",
      rateSource: "central_bank",
      contractingEntity: "entity-a",
      billingSeller: "entity-a",
      invoiceSeries: "entity-a:eg",
    });
  });

  it("drops the rate source when the currencies match", () => {
    const same = { ...EG, [BILLING_PACK_KEYS.collectionCurrency]: "USD" };
    expect(billingTermsOf(values(same), "us").rateSource).toBeNull();
  });

  it("opens a series per seller", () => {
    const local = { ...EG, [BILLING_PACK_KEYS.billingSeller]: "entity-b" };
    expect(billingTermsOf(values(local), "us").invoiceSeries).toBe("entity-b:us");
  });

  it("refuses missing, malformed and unconvertible values", () => {
    expect(() => billingTermsOf(values(without(BILLING_PACK_KEYS.billingSeller)), "eg")).toThrow(
      /sets no billing.billing_seller/,
    );
    expect(() =>
      billingTermsOf(values({ ...EG, [BILLING_PACK_KEYS.regionalTier]: 3 }), "eg"),
    ).toThrow(/not text/);
    expect(() => billingTermsOf(values(without(BILLING_PACK_KEYS.rateSource)), "eg")).toThrow(
      /no billing.rate_source/,
    );
    expect(() =>
      billingTermsOf(values({ ...EG, [BILLING_PACK_KEYS.priceCurrency]: "XYZ" }), "eg"),
    ).toThrow(RangeError);
  });
});
