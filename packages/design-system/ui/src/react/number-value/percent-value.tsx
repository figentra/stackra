/**
 * Stackra file contract:
 * Purpose: the web `PercentValue`: a share written as a percent.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`); isolated in a `<bdi>`
 *           so a number keeps its order inside Arabic text, with tabular digits.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { useNumberFormat } from "#react/hooks/use-number-format";
import type { PercentValueProps } from "#react/number-value/percent-value.props";

/** A share written as a percent. */
export function PercentValue({ value, fractionDigits = 0, showSign = false, className }: PercentValueProps): ReactElement {
  const format = useNumberFormat();
  return (
    <bdi data-slot="percent-value" className={cn("tabular-nums", className)}>
      {format(value, { style: "percent", maximumFractionDigits: fractionDigits, ...(showSign ? { signDisplay: "exceptZero" as const } : {}) })}
    </bdi>
  );
}
