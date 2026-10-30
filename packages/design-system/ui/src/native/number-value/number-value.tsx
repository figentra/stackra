/**
 * Stackra file contract:
 * Purpose: the native `NumberValue`: a number in the locale and the customer's digits.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`), with tabular digits.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import type { ReactElement } from "react";

import { useNumberFormat } from "#native/hooks/use-number-format";
import type { NumberValueProps } from "#native/number-value/number-value.props";
import { Text } from "#native/text/text";

/** A number in the locale and the customer's digits. */
export function NumberValue({ value, options, className }: NumberValueProps): ReactElement {
  const format = useNumberFormat();
  return (
    <Text {...(className ? { className } : {})}>
      {format(value, options)}
    </Text>
  );
}
