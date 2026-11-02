/**
 * Stackra file contract:
 * Purpose: the dots of a dot loader on the web: a grid of square dots lit in floor order, the emphasis dot in its
 *   own colour.
 * Boundary: drawing only, hidden from assistive technology; the owning component carries the role, name and value.
 *   Not exported from `./react`.
 * Runtime: browser
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md (FR-002 to FR-006)
 */
import type { CSSProperties, ReactElement } from "react";

import { DOT_LOADER } from "#core/constants/dot-loader.constant";

interface DotGridProps {
  /** Columns and rows of the grid; floor order is the bottom row first, each row from the inline start. */
  readonly cols: number;
  readonly rows: number;
  /** The dot's side in pixels. */
  readonly dot: number;
  /** The gap in pixels; omit it to spread the columns across the full width (a bar). */
  readonly gap?: number | undefined;
  /** How many dots are lit, in floor order. */
  readonly lit: number;
  /** The floor-order index of the dot drawn in the emphasis colour, or -1 for none. */
  readonly emphasisAt: number;
  readonly color: string;
  readonly emphasis: string;
}

/** A grid of dots. Its columns follow the reading direction, so in right-to-left the rows fill from the right. */
export function DotGrid({
  cols,
  rows,
  dot,
  gap,
  lit,
  emphasisAt,
  color,
  emphasis,
}: DotGridProps): ReactElement {
  const grid: CSSProperties = {
    display: gap === undefined ? "grid" : "inline-grid",
    gridTemplateColumns:
      gap === undefined ? `repeat(${cols}, minmax(0, 1fr))` : `repeat(${cols}, ${dot}px)`,
    gap: `${gap ?? 0}px`,
    justifyItems: gap === undefined ? "center" : undefined,
    color,
  };
  return (
    <span aria-hidden data-slot="dot-grid" style={grid}>
      {Array.from({ length: cols * rows }, (_, index) => {
        const floor = (rows - 1 - Math.floor(index / cols)) * cols + (index % cols);
        const isLit = floor < lit;
        return (
          <span
            key={index}
            data-slot="dot"
            data-lit={isLit || undefined}
            style={{
              display: "block",
              inlineSize: dot,
              blockSize: dot,
              background: floor === emphasisAt ? emphasis : "currentColor",
              opacity: isLit ? 1 : DOT_LOADER.unlitOpacity,
            }}
          />
        );
      })}
    </span>
  );
}
