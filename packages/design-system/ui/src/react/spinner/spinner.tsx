/**
 * Stackra file contract:
 * Purpose: the web `Spinner`: the brand's dot loader, a 3×3 cell of dots that builds the st tile's floors, lit one
 *          80 ms step at a time with the ninth dot in the emphasis colour, held, then cleared. `tone` colours the dots,
 *          `size` sets the cell (16, 24 or 32 px), `label` names one status, or the spinner is hidden when there is
 *          none, and every other span prop passes through.
 * Boundary: draws its own dots under the loaders' exception to ADR 0303 decision 6 (owner, 2026-11-02); the timing is
 *          `dotLoaderLit`, the drawing `DotGrid`. Reduced motion (the system's or the provider's) shows the full cell
 *          at rest, dimmed.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 6, the loaders' exception of 2026-11-02; decision 7); ADR 0302 (decision 3);
 *          .agents/specs/sta-2017-dot-loader/spec.md (FR-002, FR-006, FR-007); figentra/brand rules §41.
 */
import type { ReactElement } from "react";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";
import { useMotion } from "#react/design-system-provider/use-motion";
import { DotGrid } from "#react/dot-loader/dot-grid";
import { dotColors } from "#react/dot-loader/dot-colors.function";
import { useDotLoader } from "#react/hooks/use-dot-loader";
import type { SpinnerProps } from "#react/spinner/spinner.props";

/** The dot loader's indeterminate cell: one status when labelled, hidden otherwise. */
export function Spinner({
  size = "md",
  tone = "accent",
  label,
  style,
  ...rest
}: SpinnerProps): ReactElement {
  const isRunning = useMotion() === "full";
  const lit = useDotLoader(9, isRunning);
  // An unknown size (a caller past the types) draws md, as HeroUI did, instead of throwing.
  const { dot, gap } = DOT_LOADER.cell[size] ?? DOT_LOADER.cell.md;
  const { color, emphasis } = dotColors(tone);
  return (
    <span
      {...rest}
      data-slot="spinner"
      data-size={size}
      data-tone={tone}
      style={{
        display: "inline-flex",
        color,
        ...(isRunning ? {} : { opacity: DOT_LOADER.reducedOpacity }),
        ...style,
      }}
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
    >
      <DotGrid
        cols={3}
        rows={3}
        dot={dot}
        gap={gap}
        lit={lit}
        emphasisAt={8}
        color="currentColor"
        emphasis={emphasis}
      />
    </span>
  );
}
