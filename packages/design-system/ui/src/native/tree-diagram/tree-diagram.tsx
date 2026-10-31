/**
 * Stackra file contract:
 * Purpose: the native `TreeDiagram`: a hierarchy as a node-link tree laid out by `treeLayoutOf`: levels in columns
 *          from the reading start, a dot per node with its name (and figure) after it, curves from each parent to its
 *          children, each branch in its own colour; one image whose value reads every node with its path.
 * Boundary: Skia curves and dots at the measured width; names are RN Text laid over the canvas, so Arabic is shaped by
 *           the platform. Mirrors right to left. No motion.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { Canvas, Circle, Path } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { View } from "react-native";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { isArabic } from "#core/functions/is-arabic.function";
import { treeLayoutOf } from "#core/functions/tree-layout-of.function";
import { alphaOf } from "#native/chart/alpha-of.function";
import { useCanvasSize } from "#native/chart/use-canvas-size";
import { useChartLocale } from "#native/chart/use-chart-locale";
import { useChartPaint } from "#native/chart/use-chart-paint";
import { Text } from "#native/text/text";
import type { TreeDiagramProps } from "#native/tree-diagram/tree-diagram.props";

/** A leaf's row height when no height is given. */
const ROW = 28;
/** The separator of a node's path when spoken. */
const TRAIL = " › ";

/** Count the leaves under a forest. */
const leavesOf = (items: TreeDiagramProps["items"]): number =>
  items.reduce((sum, item) => sum + (item.children?.length ? leavesOf(item.children) : 1), 0);

/** A hierarchy as a tree. */
export function TreeDiagram({
  items,
  label,
  valueFormat,
  palette,
  height,
  className,
}: TreeDiagramProps): ReactElement {
  const { locale, isRtl } = useChartLocale();
  const { width, onLayout } = useCanvasSize();
  const tall = height ?? Math.max(ROW * 2, leavesOf(items) * ROW);
  const layout = treeLayoutOf(items, { width, height: tall, isRtl, padding: 8, labelRoom: 110 });
  const branches = Math.max(0, ...layout.nodes.map((node) => node.branch)) + 1;
  const paint = useChartPaint(
    Array.from({ length: branches }, (_, index) => chartColorOf(undefined, index, palette)),
  );
  const colorOf = (branch: number) => (branch < 0 ? paint.muted : (paint.series[branch] ?? ""));
  const value = (figure: number | undefined) =>
    figure === undefined ? "" : ` ${formatChartNumber(figure, locale, valueFormat)}`;
  const spoken = layout.nodes
    .map((node) => `${node.trail.join(TRAIL)}${value(node.value)}`)
    .join(isArabic(locale) ? "، " : ", ");
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityValue={{ text: spoken }}
      onLayout={onLayout}
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ height: tall }}
    >
      {width > 0 ? (
        <Canvas style={{ width, height: tall }}>
          {layout.links.map((link) => (
            <Path
              key={link.key}
              path={link.path}
              // oxlint-disable-next-line react/style-prop-object -- Skia's paint style is the string "stroke" or "fill", not a style object
              style="stroke"
              strokeWidth={1.5}
              color={alphaOf(colorOf(link.branch), 0.5)}
            />
          ))}
          {layout.nodes.map((node) => (
            <Circle
              key={node.item.key}
              cx={node.x}
              cy={node.y}
              r={node.isLeaf ? 4 : 5}
              color={colorOf(node.branch)}
            />
          ))}
        </Canvas>
      ) : null}
      {width > 0
        ? layout.nodes.map((node) => {
            const isAfter = node.isLeaf || node.depth === 0;
            const isRight = isAfter !== isRtl;
            return (
              <View
                key={node.item.key}
                pointerEvents="none"
                className="absolute flex-row rounded-[var(--radius-control-inner)] bg-surface px-1"
                style={{
                  top: node.y - 9,
                  ...(isRight ? { left: node.x + 8 } : { right: width - node.x + 8 }),
                }}
              >
                <Text type="caption" numberOfLines={1}>
                  {node.item.label}
                </Text>
                {node.value === undefined ? null : (
                  <Text type="caption" tone="muted" numberOfLines={1} className="tabular-nums">
                    {value(node.value)}
                  </Text>
                )}
              </View>
            );
          })
        : null}
    </View>
  );
}
