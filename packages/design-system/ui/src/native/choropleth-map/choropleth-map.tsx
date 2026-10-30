/**
 * Stackra file contract:
 * Purpose: the native `ChoroplethMap`: the caller's GeoJSON regions shaded in five steps of one colour by value (empty
 *          for a region with none), outlined in the muted colour, with a Less–More scale under the map; one image whose
 *          value reads every region.
 * Boundary: Skia paths from `choroplethShapesOf` at the measured width (even-odd fill for holes); no map data ships
 *           here. A map is never mirrored; the scale follows the reading direction. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); RFC 7946; WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { Canvas, Path } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { CHART_SHADES } from "#core/constants/chart-shades.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { choroplethShapesOf } from "#core/functions/choropleth-shapes-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { valueLevelOf } from "#core/functions/value-level-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { alphaOf } from "#native/chart/alpha-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { ChoroplethMapProps } from "#native/choropleth-map/choropleth-map.props";
import { Text } from "#native/text/text";

/** Regions shaded by value. */
export function ChoroplethMap({
  features,
  values,
  idKey,
  nameKey,
  label,
  valueFormat,
  color = "chart-ramp-1",
  height = 280,
  className,
}: ChoroplethMapProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const K = UI_KEYS.ui.chart;
  const { width, onLayout } = useCanvasSize();
  const paint = useChartPaint([color]);
  const fill = paint.series[0] ?? "";
  const shapes = choroplethShapesOf(features, {
    width: Math.max(width, 1),
    height,
    values,
    idKey,
    nameKey,
  });
  const known = shapes.flatMap((shape) => (shape.value === null ? [] : [shape.value]));
  const [min, max] = [Math.min(...known), Math.max(...known)];
  const value = (figure: number | null) =>
    figure === null ? t(K.no_data) : formatChartNumber(figure, locale, valueFormat);
  const spoken = shapes
    .map((shape) => `${shape.name} ${value(shape.value)}`)
    .join(isArabic(locale) ? "، " : ", ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      className={["w-full gap-3", className].filter(Boolean).join(" ")}
    >
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 ? (
          <Canvas style={{ width, height }}>
            {shapes.flatMap((shape) => [
              <Path
                key={`fill-${shape.id}`}
                path={shape.path}
                fillType="evenOdd"
                color={
                  shape.value === null
                    ? paint.grid
                    : alphaOf(fill, CHART_SHADES[valueLevelOf(shape.value, min, max)] ?? 1)
                }
              />,
              <Path
                key={`edge-${shape.id}`}
                path={shape.path}
                // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
                style="stroke"
                strokeWidth={1}
                color={alphaOf(paint.muted, 0.45)}
              />,
            ])}
          </Canvas>
        ) : null}
      </View>
      <View className="flex-row items-center justify-center gap-1.5">
        <Text type="caption" tone="muted">
          {t(K.less)}
        </Text>
        {CHART_SHADES.map((shade) => (
          <View
            key={shade}
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: alphaOf(fill, shade) }}
          />
        ))}
        <Text type="caption" tone="muted">
          {t(K.more)}
        </Text>
        {known.length < shapes.length ? (
          <>
            <View className="ms-3 size-2.5 rounded-sm" style={{ backgroundColor: paint.grid }} />
            <Text type="caption" tone="muted">
              {t(K.no_data)}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}
