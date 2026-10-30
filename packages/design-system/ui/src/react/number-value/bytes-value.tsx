/**
 * Stackra file contract:
 * Purpose: the web `BytesValue`: a size in bytes in its best unit.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`); isolated in a `<bdi>`
 *           so a number keeps its order inside Arabic text, with tabular digits.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { bytesUnitOf } from "#core/functions/bytes-unit-of.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import type { BytesValueProps } from "#react/number-value/bytes-value.props";

/** A size in bytes in its best unit. */
export function BytesValue({ value, base = "decimal", fractionDigits = 1, className }: BytesValueProps): ReactElement {
  const format = useNumberFormat();
  const size = bytesUnitOf(value, base);
  return (
    <bdi data-slot="bytes-value" className={cn("tabular-nums", className)}>
      {format(size.value, {
        style: "unit",
        unit: size.unit,
        maximumFractionDigits: size.unit === "byte" ? 0 : fractionDigits,
      })}
    </bdi>
  );
}
