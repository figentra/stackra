/**
 * Stackra file contract:
 * Purpose: the web `Stack`: children in a column with an even gap from the spacing scale.
 * Boundary: a plain `div`, no surface; passes every `div` prop through.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29, wave C).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { SPACE_GAP_CLASS } from "#core/constants/space-gap-class.constant";
import type { StackProps } from "#react/layout/stack.props";

/** The cross-axis class of each alignment. */
const ALIGN = {
  stretch: "items-stretch",
  start: "items-start",
  center: "items-center",
  end: "items-end",
} as const;

/** Blocks in a column with an even gap. */
export function Stack({
  children,
  gap = "md",
  align = "stretch",
  className,
  ...rest
}: StackProps): ReactElement {
  return (
    <div
      {...rest}
      data-slot="stack"
      className={cn("flex min-w-0 flex-col", SPACE_GAP_CLASS[gap], ALIGN[align], className)}
    >
      {children}
    </div>
  );
}
