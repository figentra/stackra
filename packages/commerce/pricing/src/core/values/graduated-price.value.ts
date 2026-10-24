/**
 * Stackra file contract:
 * Purpose: `GraduatedPrice`, a per-unit price in bands: each unit costs the unit price of the band it falls in, so the
 *          first band at zero is an included amount and later bands price the usage above it (AI credits, messages,
 *          automation runs, API calls over the included amount). `total(quantity)` is the exact charge.
 * Boundary: a value class over `@stackra/money`. Quantities are whole units and unit prices whole minor units, so a
 *           total is exact and never rounded; a unit cheaper than one minor unit is priced per block (per 1 000 calls)
 *           by counting blocks. Instances are plain data (no `#private`, not frozen); build one with
 *           `GraduatedPrice.of`. Which bands a plan has and how usage is metered belong to the entitlement system and
 *           the OS pricing service. Refusals are `RangeError`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0242 (decision 2: metered usage for the cost drivers over the included amount); ADR 0220
 *                     (decision 1: minor units); ADR 0127 (pricing primitives in commerce; the engine is an OS service).
 */
import { Money } from "@stackra/money";
import type { CurrencyCode } from "@stackra/money";

import type { PriceTier } from "#core/types/price-tier.type";

/**
 * A per-unit price in ascending bands, the last one open.
 *
 * @example
 * const messages = GraduatedPrice.of([
 *   { upTo: 1_000, unitPrice: Money.zero("USD") }, // included
 *   { upTo: 10_000, unitPrice: Money.ofMinor(2, "USD") },
 *   { upTo: null, unitPrice: Money.ofMinor(1, "USD") },
 * ]);
 * messages.total(12_000).toDecimal(); // "200.00": 9 000 × 0.02 + 2 000 × 0.01
 */
export class GraduatedPrice {
  /** The bands, in ascending order of `upTo`, the last one open. */
  readonly tiers: readonly PriceTier[];

  /** The currency of every unit price and of every total. */
  readonly currency: CurrencyCode;

  private constructor(tiers: readonly PriceTier[], currency: CurrencyCode) {
    this.tiers = tiers;
    this.currency = currency;
  }

  /**
   * A graduated price from its bands.
   *
   * @param tiers - at least one band; each bounded `upTo` a positive safe integer above the one before, only the last
   *   band open (`upTo: null`), every unit price in one currency.
   * @throws RangeError when `tiers` is empty, a bound is not a positive safe integer or not above the one before, a band
   *   other than the last is open, the last is bounded, or the unit prices mix currencies.
   */
  static of(tiers: readonly PriceTier[]): GraduatedPrice {
    const [first] = tiers;
    if (first === undefined) throw new RangeError("GraduatedPrice.of: give at least one tier");
    const currency = first.unitPrice.currency;
    let previous = 0;
    tiers.forEach((tier, index) => {
      if (tier.unitPrice.currency !== currency)
        throw new RangeError(
          `GraduatedPrice.of: tier ${index} is in ${tier.unitPrice.currency}, tier 0 in ${currency}`,
        );
      const isLast = index === tiers.length - 1;
      if (tier.upTo === null) {
        if (!isLast)
          throw new RangeError(
            `GraduatedPrice.of: only the last tier can be open, tier ${index} is`,
          );
        return;
      }
      if (isLast)
        throw new RangeError("GraduatedPrice.of: the last tier must be open (upTo: null)");
      if (!Number.isSafeInteger(tier.upTo) || tier.upTo <= previous)
        throw new RangeError(
          `GraduatedPrice.of: tier ${index} upTo must be a safe integer above ${previous}, got ${tier.upTo}`,
        );
      previous = tier.upTo;
    });
    return new GraduatedPrice([...tiers], currency);
  }

  /**
   * The charge for `quantity` units: the units in each band times that band's unit price, summed.
   *
   * @param quantity - whole units used; a non-negative safe integer.
   * @returns the exact total in this price's currency; zero for no units.
   * @throws RangeError when `quantity` is not a non-negative safe integer or the total is beyond the safe-integer limit.
   */
  total(quantity: number): Money {
    if (!Number.isSafeInteger(quantity) || quantity < 0)
      throw new RangeError(
        `GraduatedPrice.total: the quantity must be a non-negative safe integer, got ${quantity}`,
      );
    let total = Money.zero(this.currency);
    let start = 0;
    for (const tier of this.tiers) {
      const end = tier.upTo === null ? quantity : Math.min(quantity, tier.upTo);
      if (end > start) total = total.plus(tier.unitPrice.times(end - start));
      if (tier.upTo === null || quantity <= tier.upTo) break;
      start = tier.upTo;
    }
    return total;
  }
}
