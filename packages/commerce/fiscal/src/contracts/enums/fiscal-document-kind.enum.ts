/**
 * Stackra file contract:
 * Purpose: `FiscalDocumentKind`, what a fiscal document is: a full tax invoice, a simplified invoice or receipt, a
 *          credit note or a debit note.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Each driver maps a kind to its own
 *           format's code (a UNCL 1001 type code, an ETA document type, a Verifactu invoice type). Codes are
 *           snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * A credit or debit note names the document it corrects in `FiscalDocument.original`.
 *
 * @example
 * const note = { ...invoice, kind: FiscalDocumentKind.CreditNote, original: { number: invoice.number, issuedAt } };
 */
export const FiscalDocumentKind = Enum.of({
  /** A full tax invoice with an identified buyer. */
  Invoice: "invoice",
  /** A simplified invoice or till receipt; the buyer may be anonymous. */
  Simplified: "simplified",
  /** A note that reduces an earlier document. */
  CreditNote: "credit_note",
  /** A note that adds to an earlier document. */
  DebitNote: "debit_note",
});

/** One of the codes above. */
export type FiscalDocumentKind = Enum.Value<typeof FiscalDocumentKind>;
