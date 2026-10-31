/**
 * Stackra file contract:
 * Purpose: `ChartReadout`, the native chart's tooltip: while a finger rests on the plot, a card over its top edge in
 *          the overlay colours (1px separator border, overlay shadow, theme radius, at least 140 wide, 12 by 8
 *          padding, 6 between rows) with the pressed row's title (extra small, medium, muted) and one row per series:
 *          its indicator, its label (extra small, muted, taking the room) and its value (extra small, semibold,
 *          foreground, tabular) at the end edge.
 * Boundary: Views and Text, so Arabic is shaped and the rows follow the layout direction; the indicator takes the
 *           series' resolved colour. Hidden from assistive technology, which hears every value in the chart's value.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); STA-1371 (chart style spec).
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { THEME_PX } from "#core/constants/theme-px.constant";
import type { ChartReadoutProps } from "#native/chart/chart-readout.props";
import { Text } from "#native/text/text";

/** The pressed row's values. */
export function ChartReadout({ title, items, indicator = "dot" }: ChartReadoutProps): ReactElement {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ zIndex: THEME_PX.zIndex["raised"] }}
      className="absolute start-0 top-0 min-w-readout gap-1.5 rounded-[var(--radius-control)] border border-separator bg-overlay px-3 py-2 shadow-overlay"
    >
      <Text type="caption" tone="muted" className="text-xs font-medium">
        {title}
      </Text>
      {items.map((item) => (
        <View key={item.label} className="flex-row items-center gap-2">
          <View
            className={
              indicator === "line"
                ? "h-3 w-1 rounded-[var(--radius-pill)]"
                : "size-2 rounded-[var(--radius-pill)]"
            }
            style={{ backgroundColor: item.color }}
          />
          <Text type="caption" tone="muted" className="flex-1 text-xs">
            {item.label}
          </Text>
          <Text type="caption" className="text-xs font-semibold tabular-nums">
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
