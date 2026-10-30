/**
 * Stackra file contract:
 * Purpose: the web `Center`: a column centred in its container, capped at a reading measure, with a gutter on both
 *          sides.
 * Boundary: a plain `div` with equal inline margins and padding, so it is the same in right-to-left. Passes every
 *           `div` prop through.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { CenterProps } from "#react/layout/center.props";

/** The cap of each width. */
const MAX = {
  sm: "max-w-sm",
  md: "max-w-lg",
  prose: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

/** A centred column. */
export function Center({
  children,
  maxWidth = "prose",
  isTextCentered = false,
  className,
  ...rest
}: CenterProps): ReactElement {
  return (
    <div
      {...rest}
      data-slot="center"
      className={cn(
        "mx-auto w-full min-w-0 px-4",
        MAX[maxWidth],
        isTextCentered && "text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
