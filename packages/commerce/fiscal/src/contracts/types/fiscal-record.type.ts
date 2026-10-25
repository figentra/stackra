/**
 * Stackra file contract:
 * Purpose: `FiscalRecord`, one sealed document in a unit's journal: the payload the authority sees, its hash and the
 *          hash before it, the signature, the receipt QR, the driver's marks, and where submission stands.
 * Boundary: a type only; what `FiscalJournal` stores. `sequence` counts from 1 per unit with no gaps; `previousHash`
 *           is the hash of record `sequence - 1`, `null` for the first. The record carries no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 3 and 7).
 */
import type { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";
import type { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";

/** A sealed document. */
export type FiscalRecord = {
  /** The till or invoicing unit whose chain holds it. */
  readonly unitId: string;
  /** Position in the unit's chain, from 1. */
  readonly sequence: number;
  /** The market-pack code it was sealed under. */
  readonly market: string;
  /** Invoice or till. */
  readonly channel: FiscalChannel;
  /** The driver key that sealed it. */
  readonly driver: string;
  /** `FiscalDocument.id`. */
  readonly documentId: string;
  /** `FiscalDocument.number`. */
  readonly documentNumber: string;
  /** What the authority receives (XML, JSON, a signed string), as text. */
  readonly payload: string;
  /** Media type of `payload`. */
  readonly contentType: string;
  /** The chain hash of this record, in the driver's encoding. */
  readonly hash: string;
  /** The chain hash of the record before; `null` for the first. */
  readonly previousHash: string | null;
  /** The signature or seal, when the driver signs. */
  readonly signature: string | null;
  /** The text to encode in the receipt's QR code, when the format has one. */
  readonly qr: string | null;
  /** Driver marks a receipt prints (a transaction number, a signature counter, a short signature). */
  readonly marks: Readonly<Record<string, string>>;
  /** When it was sealed. */
  readonly sealedAt: Date;
  /** Where submission stands. */
  readonly status: FiscalRecordStatus;
  /** When the last submission answered; `null` before. */
  readonly submittedAt: Date | null;
  /** The authority's id for it (a submission UUID, a CSV code). */
  readonly authorityReference: string | null;
  /** The authority's message on a rejection or a warning. */
  readonly message: string | null;
};
