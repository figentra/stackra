/**
 * Stackra file contract:
 * Purpose: the web `NumberValue`: a number in the locale and the customer's digits.
 * Boundary: display only, in the provider's locale and the customer's digits (`useNumberFormat`); isolated in a `<bdi>`
 *           so a number keeps its order inside Arabic text, with tabular digits.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); ADR 0060; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { useNumberFormat } from "#react/hooks/use-number-format";
import type { NumberValueProps } from "#react/number-value/number-value.props";

/** A number in the locale and the customer's digits. */
export function NumberValue({ value, options, className }: NumberValueProps): ReactElement {
  const format = useNumberFormat();
  return (
    <bdi data-slot="number-value" className={cn("tabular-nums", className)}>
      {format(value, options)}
    </bdi>
  );
}
