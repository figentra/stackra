/**
 * Stackra file contract:
 * Purpose: `EdiDocument`, one canonical EDI document exchanged with a trading partner: its type, the partner, our
 *          reference, when it was issued and its canonical JSON body.
 * Boundary: a type only. The body is the network's canonical JSON for the type (ecosio, TrueCommerce, SPS Commerce
 *           take one document set and do the EDIFACT, X12 or GS1 XML codecs and AS2 themselves, R3-SO-07); the mapping
 *           from our purchase orders, receipts and supplier invoices is the consuming module's. Trading partners and
 *           their document mappings are per-Connection data, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); R3-SO-07; GRO-158a; STA-795.
 */
import type { EdiDocumentType } from "#contracts/enums/edi-document-type.enum";

/** A canonical EDI document. */
export interface EdiDocument {
  /** The network's id of the document; set on a received one, left out on one we send. */
  readonly id?: string;

  /** Which document it is. */
  readonly type: EdiDocumentType;

  /** The trading partner's id on the network (a GLN, an X12 ISA id or the network's own id). */
  readonly partner: string;

  /** Our reference (a purchase order number, an invoice number), which answers quote. */
  readonly reference: string;

  /** When it was issued. */
  readonly issuedAt: Date;

  /** The network's canonical JSON body for the type. */
  readonly body: Readonly<Record<string, unknown>>;
}
