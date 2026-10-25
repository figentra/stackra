/**
 * Stackra file contract:
 * Purpose: unit tests of `ublParty`: the endpoint only when asked, the registration, address, VAT scheme and legal
 *          name; missing parts left out.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { PartyKind } from "#contracts/enums/party-kind.enum";
import { renderXml } from "#core/functions/render-xml.function";
import { ublParty } from "#core/functions/ubl-party.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";

describe("ublParty", () => {
  it("writes every part of a full party", () => {
    const xml = renderXml(ublParty(fiscalDocument().seller, true));
    expect(xml).toMatch(
      /^<cac:Party><cbc:EndpointID schemeID="0000">seller-endpoint<\/cbc:EndpointID>/,
    );
    expect(xml).toContain('<cbc:ID schemeID="CRN">REG-1</cbc:ID>');
    expect(xml).toContain("<cbc:CitySubdivisionName>Centre</cbc:CitySubdivisionName>");
    expect(xml).toContain("<cbc:CompanyID>TAX-SELLER-1</cbc:CompanyID>");
    expect(xml).toContain("<cbc:RegistrationName>Sample Seller</cbc:RegistrationName>");
  });

  it("leaves out the endpoint unless asked, and parts the party lacks", () => {
    const person = {
      kind: PartyKind.Person,
      name: "P",
      taxId: null,
      registration: null,
      address: null,
      endpoint: null,
    };
    expect(renderXml(ublParty(fiscalDocument().seller, false))).not.toContain("EndpointID");
    expect(renderXml(ublParty(person, true))).toBe(
      "<cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>P</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>",
    );
  });
});
