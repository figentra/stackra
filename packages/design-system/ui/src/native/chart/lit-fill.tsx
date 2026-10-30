/**
 * Stackra file contract:
 * Purpose: `LitFill`, a native mark's top light drawn over a view-based mark (a funnel bar, a treemap tile): a Skia
 *          canvas filling its parent with the mark's colour lit softly from the top, as the web marks are, scaled by
 *          the theme's material highlight; nothing in a flat brand, so the parent's own colour shows.
 * Boundary: presentation only; the parent keeps its background colour, shape and clipping (`overflow-hidden`).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0320 (the glass material); ADR 0165 (native); STA-1371.
 */
import { Canvas, Fill, LinearGradient, vec } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";

import { mixOf } from "#native/chart/mix-of.function";

/** `color` lit from the top over `height` points, filling the parent. */
export function LitFill({
  color,
  lift,
  height,
}: {
  readonly color: string;
  readonly lift: number;
  readonly height: number;
}): ReactElement | null {
  if (lift <= 0 || !color) return null;
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[mixOf(color, "#ffffff", 0.16 * lift), color]}
        />
      </Fill>
    </Canvas>
  );
}
