/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalParty`: the sample seller type-checks, a party without a kind does not.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { PartyKind } from "#contracts/enums/party-kind.enum";
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("FiscalParty", () => {
  it("takes a business with a tax number and an endpoint", () => {
    const seller: FiscalParty = fiscalDocument().seller;
    expect(seller.kind).toBe(PartyKind.Business);
  });

  it("takes an unregistered person and refuses a party without a kind", () => {
    const person: FiscalParty = {
      kind: PartyKind.Person,
      name: "A",
      taxId: null,
      registration: null,
      address: null,
      endpoint: null,
    };
    // @ts-expect-error -- every party has a kind
    const kindless: FiscalParty = {
      name: "A",
      taxId: null,
      registration: null,
      address: null,
      endpoint: null,
    };
    expect([person.taxId, kindless.name]).toEqual([null, "A"]);
  });
});
