/**
 * Stackra file contract:
 * Purpose: `HeatScale`, the "Less ▢▢▢▢▢ More" key under a native heatmap or calendar heatmap.
 * Boundary: Views and RN Text; hidden from assistive technology (the chart's spoken value carries the numbers).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ChartPaint } from "#native/chart/chart-paint.type";
import { heatPaintOf } from "#native/chart/heat-paint-of.function";
import { Text } from "#native/text/text";

/** The five shades between "Less" and "More". */
export function HeatScale({ paint }: { readonly paint: ChartPaint }): ReactElement {
  const t = useUiText();
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="flex-row items-center justify-end gap-1"
    >
      <Text type="caption" tone="muted" className="me-1 text-xs">
        {t(UI_KEYS.ui.chart.less)}
      </Text>
      {[0, 1, 2, 3, 4].map((level) => (
        <View
          key={level}
          className="size-3 rounded-[3px]"
          style={{ backgroundColor: heatPaintOf(level, paint) }}
        />
      ))}
      <Text type="caption" tone="muted" className="ms-1 text-xs">
        {t(UI_KEYS.ui.chart.more)}
      </Text>
    </View>
  );
}
