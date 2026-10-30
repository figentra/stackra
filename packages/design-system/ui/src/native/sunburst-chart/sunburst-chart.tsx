/**
 * Stackra file contract:
 * Purpose: the native `SunburstChart`: nested slices as rings, each branch in its top slice's colour with a surface gap
 *          between slices, and the total and `centerLabel` in the hole; one image whose value reads every slice.
 * Boundary: Skia paths from the shared `arcPathOf`; like a pie it is never mirrored. The centre is RN Text. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { Canvas, Path } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { arcPathOf } from "#core/functions/arc-path-of.function";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { sunburstLayoutOf } from "#core/functions/sunburst-layout-of.function";
import { RingCentre } from "#native/chart/ring-centre";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { useChartLocale } from "#native/chart/use-chart-locale";
import type { SunburstChartProps } from "#native/sunburst-chart/sunburst-chart.props";

/** Nested shares as rings. */
export function SunburstChart({
  items,
  label,
  valueFormat,
  palette,
  size = 260,
  centerLabel,
  className,
}: SunburstChartProps): ReactElement {
  const { locale } = useChartLocale();
  const paint = useChartPaint(items.map((item, index) => chartColorOf(item, index, palette)));
  const arcs = sunburstLayoutOf(items);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const rings = Math.max(1, ...arcs.map((arc) => arc.depth + 1));
  const outer = size / 2 - 2;
  const hole = outer * (centerLabel ? 0.44 : 0.16);
  const band = (outer - hole) / rings;
  const total = arcs.filter((arc) => arc.depth === 0).reduce((sum, arc) => sum + arc.value, 0);
  const spoken = arcs
    .map((arc) => `${arc.trail.join(" › ")} ${value(arc.value)}`)
    .join(isArabic(locale) ? "، " : ", ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      className={["items-center", className].filter(Boolean).join(" ")}
    >
      <View style={{ width: size, height: size }}>
        <Canvas style={{ width: size, height: size }}>
          {arcs.map((arc) => {
            const path = arcPathOf(
              size / 2,
              size / 2,
              hole + band * arc.depth,
              hole + band * (arc.depth + 1),
              arc.start,
              arc.end,
            );
            return [
              <Path
                key={`fill-${arc.keys.join("/")}`}
                path={path}
                color={paint.series[arc.branch] ?? ""}
              />,
              <Path
                key={`gap-${arc.keys.join("/")}`}
                path={path}
                color={paint.surface}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={2}
              />,
            ];
          })}
        </Canvas>
        {centerLabel ? <RingCentre value={value(total)} word={centerLabel} /> : null}
      </View>
    </View>
  );
}
