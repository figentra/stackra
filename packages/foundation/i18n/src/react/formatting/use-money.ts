/**
 * Stackra file contract:
 * Purpose: `useMoney()`, the hook a component shows prices with: `money = useMoney()` as a class component field,
 *          then `this.money(product.priceMinor, product.currency)` or `this.money(perMonth(price, currency))`.
 * Boundary: formats with Intl's currency style in the active locale and digits (`formatNumber`, on every engine), with exactly the currency's ISO 4217
 *           exponent of fraction digits (`Money.toDecimal`), so a price is never rounded for display. Minor units go
 *           through `Money.ofMinor`, which refuses an unsafe amount or an unknown currency.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 2: the ISO 4217 exponent), ADR 0192, ADR 0305 (class components).
 */
import { Money } from "@stackra/money";
import { useMemo } from "react";

import { formatNumber } from "#core/functions/format-number.function";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";
import type { MoneyFormatter } from "./money-formatter.type";

/**
 * The money formatter of the active locale.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const money = useMoney();
 * money(9_900, "SAR"); // "SAR 99.00" in en
 * money(Money.ofMinor(1_250, "KWD")); // "KWD 1.250" in en: the currency's three fraction digits
 */
export function useMoney(): MoneyFormatter {
  const { intlLocale, numerals } = useI18nState();
  return useMemo(() => {
    function money(amount: Money): string;
    function money(minor: number, currency: string): string;
    function money(amount: Money | number, currency?: string): string {
      const value = typeof amount === "number" ? Money.ofMinor(amount, currency ?? "") : amount;
      const decimal = value.toDecimal();
      const digits = decimal.split(".")[1]?.length ?? 0;
      // shortcut: Number() keeps 15 significant digits, exact for any realistic price; pass the decimal string once
      // every target runtime's Intl.NumberFormat accepts one (ES2023).
      return formatNumber(
        Number(decimal),
        intlLocale,
        {
          style: "currency",
          currency: value.currency,
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        },
        numerals,
      );
    }
    return money;
  }, [intlLocale, numerals]);
}
