/**
 * Stackra file contract:
 * Purpose: the web `MoneyValue`: an amount in a currency.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`); isolated in a `<bdi>`
 *           so a number keeps its order inside Arabic text, with tabular digits.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { useNumberFormat } from "#react/hooks/use-number-format";
import type { MoneyValueProps } from "#react/number-value/money-value.props";

/** An amount in a currency. */
export function MoneyValue({ amount, currency, currencyDisplay, isCompact = false, className }: MoneyValueProps): ReactElement {
  const format = useNumberFormat();
  return (
    <bdi data-slot="money-value" className={cn("tabular-nums", className)}>
      {format(amount, { style: "currency", currency, ...(currencyDisplay ? { currencyDisplay } : {}), ...(isCompact ? { notation: "compact" as const } : {}) })}
    </bdi>
  );
}
