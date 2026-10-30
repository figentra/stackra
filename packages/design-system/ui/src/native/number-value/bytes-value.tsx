/**
 * Stackra file contract:
 * Purpose: the native `BytesValue`: a size in bytes in its best unit.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`), with tabular digits.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import type { ReactElement } from "react";

import { bytesUnitOf } from "#core/functions/bytes-unit-of.function";
import { useNumberFormat } from "#native/hooks/use-number-format";
import type { BytesValueProps } from "#native/number-value/bytes-value.props";
import { Text } from "#native/text/text";

/** A size in bytes in its best unit. */
export function BytesValue({
  value,
  base = "decimal",
  fractionDigits = 1,
  className,
}: BytesValueProps): ReactElement {
  const format = useNumberFormat();
  const size = bytesUnitOf(value, base);
  return (
    <Text {...(className ? { className } : {})}>
      {format(size.value, {
        style: "unit",
        unit: size.unit,
        maximumFractionDigits: size.unit === "byte" ? 0 : fractionDigits,
      })}
    </Text>
  );
}
