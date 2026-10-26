/**
 * Stackra file contract:
 * Purpose: `rateCardOf`, the `RateCard` a `rate-card:<name>` version's rows hold: `rate` rows `{ meter, currency,
 *          unitPrice }` (decimal text to six places) and `pack` rows `{ meter, currency, units, price }`.
 * Boundary: pure; it reads untrusted admin and seed rows, so an unknown record, a malformed amount, or a second rate
 *           for the same meter and currency is a `RangeError` naming the row id.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 1 and 5); config-model section 2.
 */
import { Money, UnitPrice } from "@stackra/money";

import { rowText } from "#core/functions/row-text.function";
import { rowWhole } from "#core/functions/row-whole.function";
import type { CatalogueRow } from "#core/types/catalogue-row.type";
import type { PrepaidPack } from "#core/types/prepaid-pack.type";
import type { RateCard } from "#core/types/rate-card.type";
import type { RateCardLine } from "#core/types/rate-card-line.type";

/**
 * The rate card `key`'s `rows` hold.
 *
 * @throws RangeError for a malformed or repeated row.
 * @example
 * rateCardOf("rate-card:messaging", version.rows);
 */
export function rateCardOf(key: string, rows: readonly CatalogueRow[]): RateCard {
  const lines: RateCardLine[] = [];
  const packs: PrepaidPack[] = [];
  for (const row of rows) {
    const record = rowText("rateCardOf", row, "record");
    const meter = rowText("rateCardOf", row, "meter");
    const currency = rowText("rateCardOf", row, "currency");
    if (record === "rate") {
      const unitPrice = UnitPrice.of(rowText("rateCardOf", row, "unitPrice"), currency);
      if (
        lines.some((line) => line.meter === meter && line.unitPrice.currency === unitPrice.currency)
      )
        throw new RangeError(`rateCardOf: row ${String(row.id)} repeats ${meter} in ${currency}`);
      lines.push(Object.freeze({ meter, unitPrice }));
    } else if (record === "pack")
      packs.push(
        Object.freeze({
          meter,
          units: rowWhole("rateCardOf", row, "units", 1),
          price: Money.of(rowText("rateCardOf", row, "price"), currency),
        }),
      );
    else throw new RangeError(`rateCardOf: row ${String(row.id)} has unknown record ${record}`);
  }
  return Object.freeze({ key, lines: Object.freeze(lines), packs: Object.freeze(packs) });
}
