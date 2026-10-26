/**
 * Stackra file contract:
 * Purpose: `roundCash`, a cash total as the till collects it: moved onto the cash step of its currency's row in the
 *          market pack's cash rounding table, unless the currency has no row, or its row is optional (the US 5-cent
 *          rule) and the tenant has not turned cash rounding on.
 * Boundary: pure; the table and the switch are data (the pack's rows and the tenant setting), so no currency's step or
 *           default is named here. Only cash tenders call it; a card total is never rounded. `CashRounding.of` checks
 *           the row it uses.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3); config-model section 1; owner US-39, R3-SO-16.
 */
import type { CashRoundingRule } from "#core/types/cash-rounding-rule.type";
import { CashRounding } from "#core/values/cash-rounding.value";
import type { Money } from "#core/values/money.value";

/**
 * `total` rounded for a cash payment under `table`, with the tenant's opt-in for optional rows.
 *
 * @throws RangeError when the matching row is malformed.
 * @example
 * roundCash(Money.of("12.33", "USD"), pack.cashRounding, settings.cashRounding).toDecimal(); // "12.35" when on
 */
export function roundCash(
  total: Money,
  table: readonly CashRoundingRule[],
  optedIn: boolean,
): Money {
  const rule = table.find((row) => row.currency === total.currency);
  if (rule === undefined || (rule.optional === true && !optedIn)) return total;
  return CashRounding.of(rule).apply(total);
}
