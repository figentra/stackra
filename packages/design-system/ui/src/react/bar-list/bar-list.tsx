/**
 * Stackra file contract:
 * Purpose: the web `BarList`: ranked rows, each a soft bar from the reading start sized against the largest value,
 *          the label over the bar and the value at the end, in the customer's digits.
 * Boundary: a named list; each row's text is its label and value, so the bar is decoration. A row with `href` links
 *           its label. The bar grows from the right in Arabic (logical width).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.1; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { barListRowsOf } from "#core/functions/bar-list-rows-of.function";
import type { BarListProps } from "#react/bar-list/bar-list.props";
import { useNumberFormat } from "#react/hooks/use-number-format";

/** Ranked labels with bars. */
export function BarList({
  items,
  label,
  valueFormat,
  max,
  sort = "descending",
  className,
}: BarListProps): ReactElement {
  const format = useNumberFormat();
  return (
    <ul
      aria-label={label}
      data-slot="bar-list"
      className={cn("m-0 grid list-none gap-1.5 p-0", className)}
    >
      {barListRowsOf(items, sort, max).map((row) => (
        <li key={row.key} className="flex items-center gap-3 text-sm">
          <div className="relative min-w-0 flex-1">
            <span
              aria-hidden
              className="absolute inset-y-0 start-0 rounded-[var(--radius-control)] bg-accent-soft"
              style={{ width: `${row.share * 100}%` }}
            />
            <span className="relative block truncate px-2 py-1.5">
              {row.href ? (
                <a href={row.href} className="text-foreground underline-offset-2 hover:underline">
                  {row.label}
                </a>
              ) : (
                row.label
              )}
            </span>
          </div>
          <span className="shrink-0 font-medium tabular-nums">
            {format(row.value, valueFormat)}
          </span>
        </li>
      ))}
    </ul>
  );
}
