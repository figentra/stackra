/**
 * Stackra file contract:
 * Purpose: the native `NetworkGraph`: nodes as circles joined by lines, laid out by `networkLayoutOf`, each node
 *          coloured by its group and named under it; one image whose value reads every link.
 * Boundary: Skia lines and circles at the measured width; names are RN Text laid over the canvas, so Arabic is shaped
 *           by the platform. The layout mirrors right to left. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { networkLayoutOf } from "#core/functions/network-layout-of.function";
import { alphaOf } from "#native/chart/alpha-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { NetworkGraphProps } from "#native/network-graph/network-graph.props";
import { Text } from "#native/text/text";

/** A label's width; it is centred under its node. */
const LABEL_WIDTH = 96;

/** Who is linked to whom. */
export function NetworkGraph({
  nodes,
  links,
  label,
  valueFormat,
  palette,
  height = 320,
  className,
}: NetworkGraphProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const { width, onLayout } = useCanvasSize();
  const layout = networkLayoutOf(nodes, links, { width, height, isRtl });
  const paint = useChartPaint(
    nodes.map((node, index) => chartColorOf(node, layout.nodes[index]?.colorIndex ?? index, palette)),
  );
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const spoken = layout.links
    .map(
      ({ link, sourceIndex, targetIndex }) =>
        `${nodes[sourceIndex]?.label ?? link.source} – ${nodes[targetIndex]?.label ?? link.target} ${value(link.value ?? 1)}`,
    )
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
          {layout.links.map((line) => (
            <Line
              key={`${line.link.source}-${line.link.target}`}
              p1={vec(line.x1, line.y1)}
              p2={vec(line.x2, line.y2)}
              color={alphaOf(paint.muted, 0.4)}
              strokeWidth={line.width}
            />
          ))}
          {layout.nodes.map((point, index) => (
            <Circle
              key={point.node.key}
              cx={point.x}
              cy={point.y}
              r={point.radius}
              color={paint.series[index] ?? ""}
            />
          ))}
        </Canvas>
      ) : null}
      {width > 0
        ? layout.nodes.map((point) => (
            <View
              key={point.node.key}
              pointerEvents="none"
              className="absolute items-center"
              style={{ top: point.y + point.radius + 2, left: point.x - LABEL_WIDTH / 2, width: LABEL_WIDTH }}
            >
              <Text type="caption" numberOfLines={1}>
                {point.node.label}
              </Text>
            </View>
          ))
        : null}
    </View>
  );
}
