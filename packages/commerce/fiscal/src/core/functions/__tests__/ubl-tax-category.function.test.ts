/**
 * Stackra file contract:
 * Purpose: unit tests of `ublTaxCategory`: id, percent, the exemption when present, and the VAT scheme.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { renderXml } from "#core/functions/render-xml.function";
import { ublTaxCategory } from "#core/functions/ubl-tax-category.function";

describe("ublTaxCategory", () => {
  it("writes a standard rate without an exemption", () => {
    expect(renderXml(ublTaxCategory("cac:TaxCategory", "S", "20", null))).toBe(
      "<cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20</cbc:Percent>" +
        "<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>",
    );
  });

  it("writes the exemption code and reason", () => {
    const xml = renderXml(
      ublTaxCategory("cac:TaxCategory", "E", "0", { code: "VATEX-1", reason: "Exempt" }),
    );
    expect(xml).toContain("<cbc:TaxExemptionReasonCode>VATEX-1</cbc:TaxExemptionReasonCode>");
    expect(xml).toContain("<cbc:TaxExemptionReason>Exempt</cbc:TaxExemptionReason>");
  });
});
