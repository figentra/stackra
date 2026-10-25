/**
 * Stackra file contract:
 * Purpose: `evaluateFormula`, the unit price of a formula-priced item: each term's inputs and factor multiplied
 *          exactly, priced by its rate snapshot (`ExchangeRate#priceOf`) or its amount, rounded once with the formula's
 *          rounding, and summed.
 * Boundary: pure (ADR 0337 decision 2): the inputs, the snapshots and the currency are arguments, nothing is read.
 *           A missing input, a missing or foreign-currency rate, or a term that is neither a rate nor an amount is a
 *           `RangeError`: a price is never computed from a guessed rate.
 * Runtime: isomorphic
 * Governing contract: the MUS-216 answer (price from formula: rate source per market pack, product fields); ADR 0220
 *                     (decision 3); ADR 0337 (decisions 1 to 3).
 */
import { decimalProduct, ExchangeRate, Money } from "@stackra/money";
import type { RateSnapshot } from "@stackra/money/contracts";

import type { FormulaResult } from "#core/types/formula-result.type";
import type { PriceFormula } from "#core/types/price-formula.type";

/**
 * The unit price `formula` gives.
 *
 * @example
 * // 18-carat ring: fine gold at the day's rate, plus a making charge per gram
 * evaluateFormula(formula, { weight_grams: 12.5, purity: "0.75" }, cart.rates, "SAR").amount;
 * @throws RangeError when an input or a rate is missing, a rate or an amount is in another currency, a term is
 *   malformed, or the formula has no term.
 */
export function evaluateFormula(
  formula: PriceFormula,
  inputs: Readonly<Record<string, number | string>>,
  rates: readonly RateSnapshot[],
  currency: string,
): FormulaResult {
  if (formula.terms.length === 0) throw new RangeError("evaluateFormula: the formula has no term");
  let amount = Money.zero(currency);
  const used: RateSnapshot[] = [];
  for (const term of formula.terms) {
    const factors = term.inputs.map((name) => {
      const value = inputs[name];
      if (value === undefined)
        throw new RangeError(`evaluateFormula: the input "${name}" is missing`);
      return value;
    });
    const units = decimalProduct(term.factor, ...factors);
    if (term.rate !== null && term.amount === null) {
      const pair = term.rate;
      const snapshot = rates.find(
        (rate) => rate.base === pair.base && rate.quote === pair.quote && rate.unit === pair.unit,
      );
      if (snapshot === undefined)
        throw new RangeError(
          `evaluateFormula: no ${pair.base}${pair.unit === null ? "" : `/${pair.unit}`} rate in ${pair.quote}`,
        );
      if (snapshot.quote !== amount.currency)
        throw new RangeError(
          `evaluateFormula: the rate is in ${snapshot.quote}, the price in ${amount.currency}`,
        );
      amount = amount.plus(ExchangeRate.from(snapshot).priceOf(units, formula.rounding));
      if (!used.includes(snapshot)) used.push(snapshot);
    } else if (term.amount !== null && term.rate === null) {
      amount = amount.plus(term.amount.times(units, formula.rounding));
    } else {
      throw new RangeError("evaluateFormula: a term has exactly one of rate and amount");
    }
  }
  return { amount, rates: used };
}
