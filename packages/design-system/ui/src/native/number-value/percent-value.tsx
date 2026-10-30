/**
 * Stackra file contract:
 * Purpose: the native `PercentValue`: a share written as a percent.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`), with tabular digits.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import type { ReactElement } from "react";

import { useNumberFormat } from "#native/hooks/use-number-format";
import type { PercentValueProps } from "#native/number-value/percent-value.props";
import { Text } from "#native/text/text";

/** A share written as a percent. */
export function PercentValue({ value, fractionDigits = 0, showSign = false, className }: PercentValueProps): ReactElement {
  const format = useNumberFormat();
  return (
    <Text {...(className ? { className } : {})}>
      {format(value, { style: "percent", maximumFractionDigits: fractionDigits, ...(showSign ? { signDisplay: "exceptZero" as const } : {}) })}
    </Text>
  );
}
