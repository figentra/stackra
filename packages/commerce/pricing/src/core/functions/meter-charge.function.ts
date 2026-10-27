/**
 * Stackra file contract:
 * Purpose: `meterCharge`, what a number of units of one meter costs on a rate card, in one currency.
 * Boundary: pure. A meter with no rate in that currency is a `RangeError`, never a zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0220 (decision 3: one explicit rounding).
 */
import { Rounding } from "@stackra/contracts";
import { type Money } from "@stackra/money";

import type { RateCard } from "#core/types/rate-card.type";

/**
 * The charge for `units` of `meter` in `currency`.
 *
 * @throws RangeError when the card has no rate for the meter in that currency.
 * @example
 * meterCharge(card, "messaging.whatsapp.eg", 1_200, "USD").toDecimal();
 */
export function meterCharge(
  card: RateCard,
  meter: string,
  units: number | string,
  currency: string,
  rounding: Rounding = Rounding.HalfEven,
): Money {
  const line = card.lines.find(
    (held) => held.meter === meter && held.unitPrice.currency === currency,
  );
  if (line === undefined)
    throw new RangeError(`meterCharge: ${card.key} has no ${meter} rate in ${currency}`);
  return line.unitPrice.times(units, rounding);
}
