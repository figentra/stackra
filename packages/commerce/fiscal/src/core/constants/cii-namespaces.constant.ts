/**
 * Stackra file contract:
 * Purpose: `CII_NAMESPACES`, the UN/CEFACT Cross Industry Invoice D16B namespace URIs the CII driver declares.
 * Boundary: format identity fixed by the CII standard, not market data; the profile's guideline id is a pack option.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/** CII namespaces by prefix. */
export const CII_NAMESPACES = {
  /** `rsm:` the root message. */
  rsm: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
  /** `ram:` reusable aggregate entities. */
  ram: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
  /** `udt:` unqualified data types. */
  udt: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
} as const;
