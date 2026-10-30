/**
 * Stackra file contract:
 * Purpose: the web `Grid`: equal columns, a fixed count or as many as fit at `minItemWidth`, with an even gap.
 * Boundary: a CSS grid `div`; with `minItemWidth` the columns come from `auto-fill`, and a cell never overflows a
 *           container narrower than the minimum (`min(…, 100%)`). Cells fill in reading order, so it mirrors in
 *           right-to-left. Passes every `div` prop through; a caller's `style` merges over the columns.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (wave C).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { SPACE_GAP_CLASS } from "#core/constants/space-gap-class.constant";
import type { GridProps } from "#react/layout/grid.props";

/** Cells in equal columns. */
export function Grid({
  children,
  gap = "md",
  columns,
  minItemWidth,
  className,
  style,
  ...rest
}: GridProps): ReactElement {
  const template =
    columns === undefined && minItemWidth !== undefined
      ? `repeat(auto-fill, minmax(min(${minItemWidth}px, 100%), 1fr))`
      : `repeat(${Math.max(1, Math.floor(columns ?? 2))}, minmax(0, 1fr))`;
  return (
    <div
      {...rest}
      data-slot="grid"
      className={cn("grid min-w-0", SPACE_GAP_CLASS[gap], className)}
      style={{ gridTemplateColumns: template, ...style }}
    >
      {children}
    </div>
  );
}
