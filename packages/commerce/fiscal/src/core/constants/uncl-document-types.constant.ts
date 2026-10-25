/**
 * Stackra file contract:
 * Purpose: `UNCL_DOCUMENT_TYPES`, the UNCL 1001 document type code of each document kind, as UBL and CII write it.
 * Boundary: a code list of the UN/CEFACT standard, not market data. A simplified invoice is a commercial invoice in
 *           UNCL 1001; a mandate that tells it apart does so in its own field.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/** UNCL 1001 code per `FiscalDocumentKind`. */
export const UNCL_DOCUMENT_TYPES = {
  /** Commercial invoice. */
  invoice: "380",
  /** Commercial invoice (simplified is a mandate flag, not a code). */
  simplified: "380",
  /** Credit note. */
  credit_note: "381",
  /** Debit note. */
  debit_note: "383",
} as const;
