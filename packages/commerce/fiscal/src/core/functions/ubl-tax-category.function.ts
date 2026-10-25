/**
 * Stackra file contract:
 * Purpose: `ublTaxCategory`, a UBL tax category element (`cac:TaxCategory` or `cac:ClassifiedTaxCategory`): the UNCL
 *          5305 id, the percent, the exemption code and reason when there is one, and the VAT scheme.
 * Boundary: a pure function over `xmlElement`, shared by the UBL drivers.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */
import { xmlElement } from "#core/functions/xml-element.function";
import type { XmlNode } from "#core/types/xml-node.type";

/**
 * The category with its scheme.
 *
 * @example
 * ublTaxCategory("cac:ClassifiedTaxCategory", line.taxCategory, line.taxRate, line.exemption);
 */
export function ublTaxCategory(
  name: string,
  category: string,
  rate: string,
  exemption: { readonly code: string; readonly reason: string } | null,
): XmlNode {
  return xmlElement(
    name,
    {},
    xmlElement("cbc:ID", {}, category),
    xmlElement("cbc:Percent", {}, rate),
    exemption && xmlElement("cbc:TaxExemptionReasonCode", {}, exemption.code),
    exemption && xmlElement("cbc:TaxExemptionReason", {}, exemption.reason),
    xmlElement("cac:TaxScheme", {}, xmlElement("cbc:ID", {}, "VAT")),
  );
}
