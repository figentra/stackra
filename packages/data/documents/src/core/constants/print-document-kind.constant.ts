/**
 * Stackra file contract:
 * Purpose: `PRINT_DOCUMENT_KIND`, the builder document kind of a print template (`print`): receipts, invoices, packing
 *          slips, labels, line sheets, certificates, report cards, letters and signed forms.
 * Boundary: the code a template's `kind` must carry. The builder registers the kind's surface and block set (ADR 0270
 *           decision 7 adds kinds); this package owns the data model and the renderers.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 1); ADR 0270 (decisions 6 and 7); ADR 0363 (decision 2: studios).
 */

/** The `kind` of every print template. */
export const PRINT_DOCUMENT_KIND = "print";
