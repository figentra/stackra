/**
 * Stackra file contract:
 * Purpose: `FiscalCheckPart`, one paid part of a guest check: its document id and number, when it was paid, the lines
 *          it paid for and its tenders.
 * Boundary: a type only; built by the host (a Mezzora guest check) after it splits the check by seat, item, fraction,
 *           even share or amount. Split arithmetic and tax stay upstream: a part's lines carry computed amounts, and
 *           this package never prorates them.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 8 and 9); Mezzora guest_checks spec (RES-150).
 */
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import type { FiscalPayment } from "#contracts/types/fiscal-payment.type";

/** A paid part of a check. */
export type FiscalCheckPart = {
  /** A UUID for the part's document, the journal's idempotency key with the unit. */
  readonly id: string;
  /** The part's document number from the host's sequence. */
  readonly number: string;
  /** When the part was paid. */
  readonly paidAt: Date;
  /** The lines this part paid for, amounts computed upstream; `null` for a split by amount with no lines. */
  readonly lines: readonly FiscalLine[] | null;
  /** The part's tenders. */
  readonly payments: readonly FiscalPayment[];
};
