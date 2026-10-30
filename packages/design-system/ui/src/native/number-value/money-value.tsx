/**
 * Stackra file contract:
 * Purpose: the native `MoneyValue`: an amount in a currency.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`), with tabular digits.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import type { ReactElement } from "react";

import { useNumberFormat } from "#native/hooks/use-number-format";
import type { MoneyValueProps } from "#native/number-value/money-value.props";
import { Text } from "#native/text/text";

/** An amount in a currency. */
export function MoneyValue({
  amount,
  currency,
  currencyDisplay,
  isCompact = false,
  className,
}: MoneyValueProps): ReactElement {
  const format = useNumberFormat();
  return (
    <Text {...(className ? { className } : {})}>
      {format(amount, {
        style: "currency",
        currency,
        ...(currencyDisplay ? { currencyDisplay } : {}),
        ...(isCompact ? { notation: "compact" as const } : {}),
      })}
    </Text>
  );
}
