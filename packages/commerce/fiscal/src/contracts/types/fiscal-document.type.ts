/**
 * Stackra file contract:
 * Purpose: `FiscalDocument`, the neutral document every driver seals: an invoice, receipt or note with its parties,
 *          computed lines, tenders and totals.
 * Boundary: a type only; built by the host (OS invoicing, a till) from its own records. `number` comes from the
 *           host's sequence per legal entity, branch or device; this package never numbers documents. Amounts are
 *           positive; the kind says whether a note reduces or adds. `suppliedAt` is optional and additive
 *           (stackra-31): a host whose supply date differs from the issue date states it.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 8 and 9); ADR 0220 (money).
 */
import type { CurrencyCode, Money } from "@stackra/money";

import type { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import type { FiscalPayment } from "#contracts/types/fiscal-payment.type";

/** A document; `net + tax = gross`, and each total is the sum of its lines. */
export type FiscalDocument = {
  /** A UUID that identifies the document everywhere; the journal's idempotency key with the unit. */
  readonly id: string;
  /** The human document number from the host's sequence. */
  readonly number: string;
  /** Invoice, simplified, credit note or debit note. */
  readonly kind: FiscalDocumentKind;
  /** When it was issued. */
  readonly issuedAt: Date;
  /** When the goods or services were supplied, when that differs from `issuedAt`; drivers that print it fall back. */
  readonly suppliedAt?: Date;
  /** The document currency. */
  readonly currency: CurrencyCode;
  /** The issuer of the document, the seller. */
  readonly seller: FiscalParty;
  /** The buyer; `null` on an anonymous receipt. */
  readonly buyer: FiscalParty | null;
  /** The buyer's own reference (a purchase order), when given. */
  readonly buyerReference: string | null;
  /** Lines, in order. */
  readonly lines: readonly FiscalLine[];
  /** Tenders; empty for an invoice paid later. */
  readonly payments: readonly FiscalPayment[];
  /** Sum of line nets. */
  readonly net: Money;
  /** Sum of line taxes. */
  readonly tax: Money;
  /** `net + tax`. */
  readonly gross: Money;
  /**
   * The document a note corrects, why, and the authority's id for it when it has one; `null` for an invoice or
   * receipt.
   */
  readonly original: {
    readonly number: string;
    readonly issuedAt: Date;
    readonly reason: string;
    readonly reference: string | null;
  } | null;
};
