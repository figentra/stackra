/**
 * Stackra file contract:
 * Purpose: `FiscalPayment`, one tender on a fiscal document: the tenant's payment method code and the amount.
 * Boundary: a type only. `method` is the tenant's own code; a till driver maps it to its format's payment type through
 *           its pack options, never through a list in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8).
 */
import type { Money } from "@stackra/money";

/** A tender; several make up a split payment. */
export type FiscalPayment = {
  /** The tenant's payment method code (`cash`, `card`). */
  readonly method: string;
  /** Amount tendered by this method. */
  readonly amount: Money;
};
