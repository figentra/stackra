/**
 * Stackra file contract:
 * Purpose: `centreLabel`, the Recharts `<Label>` content that writes a donut's or radial chart's total and its word in
 *          the middle of the ring, in the theme's foreground and muted colours.
 * Boundary: SVG text with presentation attributes only; centred, so it needs no mirroring.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/charts at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import type { ReactElement } from "react";

import { CHART_PAINT } from "#react/chart/chart-paint.constant";

/** A Label `content` that draws `value` above `word` at the ring's centre. */
export function centreLabel(value: string, word: string) {
  return function CentreLabel({ viewBox }: { readonly viewBox?: unknown }): ReactElement | null {
    const box = viewBox as { readonly cx?: number; readonly cy?: number } | undefined;
    if (typeof box?.cx !== "number" || typeof box.cy !== "number") return null;
    return (
      <text x={box.cx} y={box.cy} textAnchor="middle" dominantBaseline="middle" aria-hidden="true">
        <tspan
          x={box.cx}
          y={box.cy - 4}
          fill={CHART_PAINT.centreValue}
          fontSize={28}
          fontWeight={700}
        >
          {value}
        </tspan>
        <tspan x={box.cx} y={box.cy + 20} fill={CHART_PAINT.centreLabel} fontSize={12}>
          {word}
        </tspan>
      </text>
    );
  };
}
