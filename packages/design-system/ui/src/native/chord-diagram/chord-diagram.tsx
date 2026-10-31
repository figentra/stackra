/**
 * Stackra file contract:
 * Purpose: the native `ChordDiagram`: groups as arcs round a ring, each as long as all that leaves and reaches it, and
 *          each flow as a ribbon through the middle in its source's colour (`chordLayoutOf`); every group named outside
 *          its arc; one image whose value reads every flow.
 * Boundary: Skia paths in a square of `size` (narrowed to the measured width); names are RN Text laid over the canvas,
 *           so Arabic is shaped by the platform. Like a pie, it reads clockwise from the top and is never mirrored.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { Canvas, Path } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chordLayoutOf } from "#core/functions/chord-layout-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { alphaOf } from "#native/chart/alpha-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import type { ChordDiagramProps } from "#native/chord-diagram/chord-diagram.props";
import { Text } from "#native/text/text";

/** The room kept round the ring for the groups' names, and a name's width. */
const LABEL_ROOM = 56;
const LABEL_WIDTH = 96;

/** Flows between groups round a circle. */
export function ChordDiagram({
  nodes,
  links,
  label,
  valueFormat,
  palette,
  size = 320,
  className,
}: ChordDiagramProps): ReactElement {
  const { locale } = useChartLocale();
  const { width, onLayout } = useCanvasSize();
  const side = Math.min(size, width || size);
  const centre = side / 2;
  const outer = Math.max(0, centre - LABEL_ROOM);
  const layout = chordLayoutOf(nodes, links, { cx: centre, cy: centre, inner: Math.max(0, outer - 10), outer });
  const paint = useChartPaint(nodes.map((node, index) => chartColorOf(node, index, palette)));
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const nameOf = (key: string) => nodes.find((node) => node.key === key)?.label ?? key;
  const spoken = layout.ribbons
    .map(({ link }) => `${nameOf(link.source)} → ${nameOf(link.target)} ${value(link.value)}`)
    .join(isArabic(locale) ? "، " : ", ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      onLayout={onLayout}
      className={["w-full items-center", className].filter(Boolean).join(" ")}
      style={{ height: side }}
    >
      {width > 0 ? (
        <View style={{ width: side, height: side }}>
          <Canvas style={{ width: side, height: side }}>
            {layout.ribbons.map((ribbon) => (
              <Path
                key={`${ribbon.link.source}-${ribbon.link.target}`}
                path={ribbon.path}
                color={alphaOf(paint.series[ribbon.sourceIndex] ?? "", 0.55)}
              />
            ))}
            {layout.groups.map((group) =>
              group.value > 0 ? (
                <Path key={group.node.key} path={group.path} color={paint.series[group.index] ?? ""} />
              ) : null,
            )}
          </Canvas>
          {layout.groups.map((group) => {
            if (group.value <= 0) return null;
            const middle = (group.start + group.end) / 2;
            const x = centre + (outer + 6) * Math.sin(middle);
            const y = centre - (outer + 6) * Math.cos(middle);
            const lean = Math.sin(middle);
            return (
              <View
                key={group.node.key}
                pointerEvents="none"
                className={[
                  "absolute",
                  lean > 0.1 ? "items-start" : lean < -0.1 ? "items-end" : "items-center",
                ].join(" ")}
                style={{
                  top: y - 8,
                  width: LABEL_WIDTH,
                  left: lean > 0.1 ? x : lean < -0.1 ? x - LABEL_WIDTH : x - LABEL_WIDTH / 2,
                }}
              >
                <Text type="caption" numberOfLines={1}>
                  {group.node.label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
