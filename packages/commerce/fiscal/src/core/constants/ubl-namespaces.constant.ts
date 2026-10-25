/**
 * Stackra file contract:
 * Purpose: `UBL_NAMESPACES`, the OASIS UBL 2.1 namespace URIs the UBL drivers declare: the invoice and credit-note
 *          roots and the aggregate, basic and extension component namespaces.
 * Boundary: format identity fixed by the UBL 2.1 standard, not market data; a mandate's own ids (customization,
 *           profile) are pack options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/** UBL 2.1 namespaces by role. */
export const UBL_NAMESPACES = {
  /** The `Invoice` root. */
  invoice: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  /** The `CreditNote` root. */
  creditNote: "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
  /** `cac:` aggregates. */
  aggregate: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  /** `cbc:` basic components. */
  basic: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  /** `ext:` extensions (where an enveloped signature goes). */
  extension: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
} as const;
