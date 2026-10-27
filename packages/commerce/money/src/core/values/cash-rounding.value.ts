/**
 * Stackra file contract:
 * Purpose: `CashRounding`, a cash total moved onto the smallest step a currency is paid in at a till (a market pack's
 *          cash rounding table row), with the difference the till books as a rounding line.
 * Boundary: a value class over `Money`; the rule (step and rounding) is market-pack data, so nothing here names a
 *           currency's step. A negative total (a refund) rounds like its positive mirror. Instances are plain data; build
 *           one with `CashRounding.of`. Refusals are `RangeError`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: one explicit rounding); config-model section 1 (market packs).
 */
import { Enum, Rounding } from "@stackra/contracts";

import type { CashRoundingRule } from "#core/types/cash-rounding-rule.type";
import type { CurrencyCode } from "#core/types/currency-code.type";
import { Money } from "#core/values/money.value";

/**
 * A market's cash step for one currency.
 *
 * @example
 * const chf = CashRounding.of(pack.cashRounding.CHF); // { currency: "CHF", incrementMinor: 5, rounding: "half_up" }
 * chf.apply(Money.of("12.32", "CHF")).toDecimal(); // "12.30"
 * chf.difference(Money.of("12.33", "CHF")).toDecimal(); // "0.02"
 */
export class CashRounding {
  /** The currency the rule is for. */
  readonly currency: CurrencyCode;

  /** The cash step in minor units. */
  readonly incrementMinor: number;

  /** How a total moves onto a step. */
  readonly rounding: Rounding;

  private constructor(currency: CurrencyCode, incrementMinor: number, rounding: Rounding) {
    this.currency = currency;
    this.incrementMinor = incrementMinor;
    this.rounding = rounding;
  }

  /**
   * The rounding a table row describes.
   *
   * @throws RangeError when the currency is not a code with minor units, the step is not a positive safe integer, or
   *   the rounding is not a `Rounding`.
   */
  static of(rule: CashRoundingRule): CashRounding {
    if (!Number.isSafeInteger(rule.incrementMinor) || rule.incrementMinor <= 0)
      throw new RangeError(
        `CashRounding.of: the step must be a positive safe integer, got ${rule.incrementMinor}`,
      );
    if (!Enum.values(Rounding).includes(rule.rounding))
      throw new RangeError(`CashRounding.of: "${String(rule.rounding)}" is not a Rounding`);
    return new CashRounding(Money.zero(rule.currency).currency, rule.incrementMinor, rule.rounding);
  }

  /**
   * `total` on a cash step.
   *
   * @throws RangeError when `total` is in another currency.
   */
  apply(total: Money): Money {
    if (total.currency !== this.currency)
      throw new RangeError(
        `CashRounding.apply: the rule is for ${this.currency}, the total is in ${total.currency}`,
      );
    return total.divide(this.incrementMinor, this.rounding).times(this.incrementMinor);
  }

  /** What rounding adds to `total` (negative when it takes away): the till's rounding line. */
  difference(total: Money): Money {
    return this.apply(total).minus(total);
  }
}
