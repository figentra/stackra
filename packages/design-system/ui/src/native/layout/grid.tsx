/**
 * Stackra file contract:
 * Purpose: the native `Grid`: equal columns, a fixed count or as many as fit at `minItemWidth`, with an even gap.
 * Boundary: React Native has no CSS grid, so the cells are cut into rows of equal flexible cells (the last row padded
 *           with empty ones, so its cells keep the column width). With `minItemWidth` the count follows the grid's
 *           measured width; until the first layout it is one column. Passes every `View` prop through.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (wave C).
 */
import { Children, type ReactElement, useState } from "react";
import { View } from "react-native";

import { SPACE_GAP_CLASS } from "#core/constants/space-gap-class.constant";
import type { GridProps } from "#native/layout/grid.props";

/** Cells in equal columns. */
export function Grid({
  children,
  gap = "md",
  columns,
  minItemWidth,
  className,
  onLayout,
  ...rest
}: GridProps): ReactElement {
  const [width, setWidth] = useState(0);
  const count = Math.max(
    1,
    Math.floor(columns ?? (minItemWidth === undefined ? 2 : width / Math.max(1, minItemWidth))),
  );
  const cells = Children.toArray(children);
  const rows: (typeof cells)[] = [];
  for (let at = 0; at < cells.length; at += count) rows.push(cells.slice(at, at + count));
  return (
    <View
      {...rest}
      className={["flex-col", SPACE_GAP_CLASS[gap], className].filter(Boolean).join(" ")}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
        onLayout?.(event);
      }}
    >
      {rows.map((row, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a row is a position, its cells carry their own keys
        <View key={index} className={`flex-row ${SPACE_GAP_CLASS[gap]}`}>
          {Array.from({ length: count }, (_, column) => (
            <View key={column} className="min-w-0 flex-1">
              {row[column] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
