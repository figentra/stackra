/**
 * Stackra file contract:
 * Purpose: `taxByRates`, the tax of a sale from a market's own rate table: each line's class looked up for the
 *          destination (the subdivision's row first, then the country's), taxed on top of the amount or, in a
 *          tax-inclusive market, taken out of it, each line rounded once with the table's rounding.
 * Boundary: pure: the table is market-pack data passed in, so a till taxes offline exactly as the server does. A line
 *           whose class has no row is a `RangeError`, never a zero rate; a zero-rated class has a row with `"0"`. A
 *           line in another currency or a malformed rate is a `RangeError` too.
 * Runtime: isomorphic
 * Governing contract: the OS-109 answer (own VAT tables); ADR 0244 (decision 9: destination-based); ADR 0220
 *                     (decision 3); ADR 0337 (decision 2).
 */
import { Money } from "@stackra/money";

import type { TaxQuote } from "#contracts/types/tax-quote.type";
import type { TaxRequest } from "#contracts/types/tax-request.type";
import type { TaxedLine } from "#contracts/types/taxed-line.type";
import type { TaxRateTable } from "#core/types/tax-rate-table.type";

/** A non-negative decimal rate: whole part and optional fraction. */
const RATE = /^(\d+)(?:\.(\d+))?$/;

/**
 * The quote a rate table gives for `request`.
 *
 * @example
 * taxByRates(
 *   { currency: "SAR", at, destination: { country: "SA" }, pricesIncludeTax: true,
 *     lines: [{ id: "l1", amount: Money.of("115.00", "SAR"), taxClass: "standard" }] },
 *   pack.taxTable, // { source: "sa@2.3.0", rounding: "half_up", rates: [{ jurisdiction: "sa", taxClass: "standard", rate: "0.15" }] }
 * ).total.toDecimal(); // "15.00"
 * @throws RangeError when a line's class has no rate for the destination, a line is in another currency, or a rate
 *   is not a non-negative decimal.
 */
export function taxByRates(request: TaxRequest, table: TaxRateTable): TaxQuote {
  const country = request.destination.country.toLowerCase();
  const region = request.destination.region?.toLowerCase() ?? null;
  const keys = region === null ? [country] : [`${country}-${region}`, country];
  let total = Money.zero(request.currency);
  const lines: TaxedLine[] = request.lines.map((line) => {
    if (line.amount.currency !== total.currency)
      throw new RangeError(
        `taxByRates: line ${line.id} is in ${line.amount.currency}, the sale in ${total.currency}`,
      );
    let found: { jurisdiction: string; rate: string } | undefined;
    for (const key of keys) {
      found = table.rates.find((row) => row.jurisdiction === key && row.taxClass === line.taxClass);
      if (found !== undefined) break;
    }
    if (found === undefined)
      throw new RangeError(
        `taxByRates: no "${line.taxClass}" rate for ${keys.join(" or ")} in ${table.source}`,
      );
    const match = RATE.exec(found.rate);
    if (match === null)
      throw new RangeError(`taxByRates: "${found.rate}" is not a non-negative decimal rate`);
    const [, whole = "0", fraction] = match;
    const onePlusRate = `${BigInt(whole) + 1n}${fraction === undefined ? "" : `.${fraction}`}`;
    const tax = request.pricesIncludeTax
      ? line.amount.minus(line.amount.divide(onePlusRate, table.rounding))
      : line.amount.times(found.rate, table.rounding);
    total = total.plus(tax);
    return { id: line.id, tax, rate: found.rate, jurisdiction: found.jurisdiction };
  });
  return { lines, total, source: table.source };
}
