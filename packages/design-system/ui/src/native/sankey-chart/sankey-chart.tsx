/**
 * Stackra file contract:
 * Purpose: the native `SankeyChart`: nodes as bars in columns and flows as bands between them, each band in its
 *          source's colour, every node named with its total; one image whose value reads every flow.
 * Boundary: Skia paths from `sankeyLayoutOf` at the measured width; labels are RN Text laid over the canvas, so Arabic
 *           is shaped by the platform. Columns run from the reading start. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { Canvas, Path, RoundedRect } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { sankeyLayoutOf } from "#core/functions/sankey-layout-of.function";
import { alphaOf } from "#native/chart/alpha-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { SankeyChartProps } from "#native/sankey-chart/sankey-chart.props";
import { Text } from "#native/text/text";

/** Flows between stages. */
export function SankeyChart({
  nodes,
  links,
  label,
  valueFormat,
  palette,
  height = 280,
  className,
}: SankeyChartProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const { width, onLayout } = useCanvasSize();
  const paint = useChartPaint(nodes.map((node, index) => chartColorOf(node, index, palette)));
  const layout = sankeyLayoutOf(nodes, links, { width, height, isRtl });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const nameOf = (key: string) => nodes.find((node) => node.key === key)?.label ?? key;
  const spoken = layout.links
    .map(({ link }) => `${nameOf(link.source)} → ${nameOf(link.target)} ${value(link.value)}`)
    .join(isArabic(locale) ? "، " : ", ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      onLayout={onLayout}
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ height }}
    >
      {width > 0 ? (
        <Canvas style={{ width, height }}>
          {layout.links.map(({ link, sourceIndex, path }) => (
            <Path
              key={`${link.source}-${link.target}`}
              path={path}
              color={alphaOf(paint.series[sourceIndex] ?? "", 0.3)}
            />
          ))}
          {layout.nodes.map((node) =>
            node.height > 0 ? (
              <RoundedRect
                key={node.node.key}
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                r={2}
                color={paint.series[node.index] ?? ""}
              />
            ) : null,
          )}
        </Canvas>
      ) : null}
      {width > 0
        ? layout.nodes.map((node) => {
            if (node.height <= 0) return null;
            // A label sits after its node, toward the reading end; the last column's sits before it.
            const isLast = node.column === layout.columns - 1 && layout.columns > 1;
            const isRight = isRtl === isLast;
            return (
              <View
                key={node.node.key}
                pointerEvents="none"
                className={["absolute", isRight ? "items-start" : "items-end"].join(" ")}
                style={{
                  top: node.y + node.height / 2 - 14,
                  ...(isRight ? { left: node.x + node.width + 6 } : { right: width - node.x + 6 }),
                }}
              >
                <Text type="caption" tone="muted" numberOfLines={1}>
                  {node.node.label}
                </Text>
                <Text type="caption" numberOfLines={1} className="font-semibold tabular-nums">
                  {value(node.value)}
                </Text>
              </View>
            );
          })
        : null}
    </View>
  );
}
