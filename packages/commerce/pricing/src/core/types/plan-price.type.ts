/**
 * Stackra file contract:
 * Purpose: `PlanPrice`, one price of a plan price list: a plan tier's price for one billing period.
 * Boundary: a type only; price-list data.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2.
 */
import type { Money } from "@stackra/money";

import type { BillingPeriod } from "#core/enums/billing-period.enum";

/** One plan price. */
export interface PlanPrice {
  /** The plan tier's key (`pro`). */
  readonly tier: string;

  /** The period it is charged for. */
  readonly period: BillingPeriod;

  /** The price, in the list's price currency. */
  readonly amount: Money;
}
