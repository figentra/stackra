/**
 * Stackra file contract:
 * Purpose: `ublParty`, a UBL `cac:Party`: the electronic address when asked for, the second registration, the postal
 *          address, the VAT registration and the legal name.
 * Boundary: a pure function over `xmlElement`, shared by the UBL drivers; optional parts the party lacks are left out,
 *           and each driver refuses a party missing what its mandate requires before calling it.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import { xmlElement } from "#core/functions/xml-element.function";
import type { XmlNode } from "#core/types/xml-node.type";

/**
 * The party element.
 *
 * @example
 * xmlElement("cac:AccountingSupplierParty", {}, ublParty(document.seller, true));
 */
export function ublParty(party: FiscalParty, withEndpoint: boolean): XmlNode {
  const address = party.address;
  return xmlElement(
    "cac:Party",
    {},
    withEndpoint && party.endpoint
      ? xmlElement("cbc:EndpointID", { schemeID: party.endpoint.scheme }, party.endpoint.id)
      : null,
    party.registration &&
      xmlElement(
        "cac:PartyIdentification",
        {},
        xmlElement("cbc:ID", { schemeID: party.registration.scheme }, party.registration.id),
      ),
    address &&
      xmlElement(
        "cac:PostalAddress",
        {},
        xmlElement("cbc:StreetName", {}, address.street),
        address.buildingNumber && xmlElement("cbc:BuildingNumber", {}, address.buildingNumber),
        address.district && xmlElement("cbc:CitySubdivisionName", {}, address.district),
        xmlElement("cbc:CityName", {}, address.city),
        address.postalCode && xmlElement("cbc:PostalZone", {}, address.postalCode),
        address.region && xmlElement("cbc:CountrySubentity", {}, address.region),
        xmlElement("cac:Country", {}, xmlElement("cbc:IdentificationCode", {}, address.country)),
      ),
    party.taxId &&
      xmlElement(
        "cac:PartyTaxScheme",
        {},
        xmlElement("cbc:CompanyID", {}, party.taxId),
        xmlElement("cac:TaxScheme", {}, xmlElement("cbc:ID", {}, "VAT")),
      ),
    xmlElement("cac:PartyLegalEntity", {}, xmlElement("cbc:RegistrationName", {}, party.name)),
  );
}
