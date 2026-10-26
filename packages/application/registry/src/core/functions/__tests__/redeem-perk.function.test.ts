/**
 * Stackra file contract:
 * Purpose: unit tests of `redeemPerk`: a code or link is returned as listed; a lead carries only the listing's fields and only after consent.
 * Boundary: test only; listings and fee schedules are test data standing in for OS admin records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1); owner M3-7.
 */
import { describe, expect, it } from "@stackra/testing";

import { redeemPerk } from "#core/functions/redeem-perk.function";

const BASE = { key: "perk-x", code: null, url: null, leadFields: [] as string[] };
const DETAILS = { company: "Acme", country: "AE", adminEmail: "rana@acme.example", phone: "+971" };

describe("redeemPerk", () => {
  it("returns the code or the link", () => {
    expect(redeemPerk({ ...BASE, redemption: "code", code: "WELCOME" }, {}, false)).toEqual({
      kind: "code",
      code: "WELCOME",
    });
    expect(
      redeemPerk({ ...BASE, redemption: "link", url: "https://partner.example/go" }, {}, false),
    ).toEqual({
      kind: "link",
      url: "https://partner.example/go",
    });
  });

  it("sends only the listed lead fields, after consent", () => {
    const listing = { ...BASE, redemption: "lead" as const, leadFields: ["company", "adminEmail"] };
    expect(redeemPerk(listing, DETAILS, true)).toEqual({
      kind: "lead",
      lead: { company: "Acme", adminEmail: "rana@acme.example" },
    });
    expect(() => redeemPerk(listing, DETAILS, false)).toThrow(/only after consent/);
    expect(() => redeemPerk(listing, { company: "Acme" }, true)).toThrow(
      /needs the tenant's adminEmail/,
    );
  });

  it("refuses a listing missing its code or link", () => {
    expect(() => redeemPerk({ ...BASE, redemption: "code" }, {}, true)).toThrow(/has no code/);
    expect(() => redeemPerk({ ...BASE, redemption: "link" }, {}, true)).toThrow(/has no url/);
  });
});
