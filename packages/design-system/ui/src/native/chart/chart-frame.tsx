/**
 * Stackra file contract:
 * Purpose: `ChartFrame`, the View every native chart draws in: one `image` element named by the chart's label whose
 *          value is its numbers read aloud, the pressed row's readout above the plot, and the legend under it.
 * Boundary: layout only; the plot is the caller's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { ChartFrameProps } from "#native/chart/chart-frame.props";
import { ChartLegend } from "#native/chart-legend/chart-legend";

/** A plot with its readout, spoken as one image, and its legend, whose entries are toggles when it can hide series. */
export function ChartFrame({
  label,
  spoken,
  legend,
  palette,
  onToggle,
  hiddenKeys,
  showComparison,
  readout,
  className,
  children,
}: ChartFrameProps): ReactElement {
  return (
    <View className={["w-full gap-3", className].filter(Boolean).join(" ")}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        accessibilityValue={{ text: spoken }}
        className="gap-3"
      >
        {readout}
        {children}
      </View>
      {legend.length > 0 ? (
        <ChartLegend
          series={legend}
          palette={palette}
          onToggle={onToggle}
          hiddenKeys={hiddenKeys}
          showComparison={showComparison}
        />
      ) : null}
    </View>
  );
}
