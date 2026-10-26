/**
 * Stackra file contract:
 * Purpose: `BillingPeriod`, how often a plan price or a credit grant recurs: monthly or annual.
 * Boundary: an `Enum.of` value plus the type of the same name. The periods a product sells are price-list rows; the
 *           annual discount is the gap between the two prices, never a constant here.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2 (annual and monthly prices).
 */
import { Enum } from "@stackra/contracts";

/** The billing periods. */
export const BillingPeriod = Enum.of({
  /** Every month. */
  Month: "month",
  /** Every year. */
  Year: "year",
});

/** One of the codes above. */
export type BillingPeriod = Enum.Value<typeof BillingPeriod>;
