/**
 * Stackra file contract:
 * Purpose: `MarketFiscalSection`, the fiscal part of a market pack on a date: its e-invoicing mandate and its till
 *          fiscal rule.
 * Boundary: a type only; what `FiscalPackSource.section` answers. `null` in a channel means the market asks nothing
 *           there, so a document in it is not sealed.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2); ADR 0363 (decision 3).
 */
import type { FiscalMandate } from "#contracts/types/fiscal-mandate.type";

/** The two channels of a pack's fiscal data. */
export type MarketFiscalSection = {
  /** The e-invoicing mandate; `null` when the market has none. */
  readonly invoice: FiscalMandate | null;
  /** The till fiscal rule; `null` when tills need no fiscal device or signed journal. */
  readonly till: FiscalMandate | null;
};
