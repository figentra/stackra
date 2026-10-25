/**
 * Stackra file contract:
 * Purpose: the native `ComposedChart` on HeroUI Native Pro's ComposedChart: the composed chart (areas, bars and lines
 *          in one cartesian chart). HeroUI Native Pro's own component and every one of its props and parts, except
 *          that its series (`Bar`, `StackedBar`, `Line`, `Area`, `StackedArea`, `AreaRange`) move to new data on the
 *          theme's reveal step by default instead of jumping (ADR 0329).
 * Boundary: no styling of its own, because the Stackra props vocabulary names nothing a composed chart takes (it draws
 *           on a Skia canvas, which has no accessible name, size or tone to map). A caller's `animate` wins, and the
 *           root's `animation="disable-all"` still stills every series. `BarGroupItem` keeps HeroUI's still default,
 *           as in `BarChart`. Its hooks stay in `heroui-native-pro/composed-chart`, and the generic props types are
 *           HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { ComposedChart as HeroComposedChart } from "heroui-native-pro/composed-chart";

import { CHART_SERIES_ANIMATE } from "#native/chart-series/chart-series-animate.constant";
import { withDefaults } from "#native/chart-series/with-defaults.function";

const ANIMATED = { animate: CHART_SERIES_ANIMATE };

/** The composed chart: HeroUI Native Pro's own ComposedChart, with every prop and part it has, its series animating to new data. */
export const ComposedChart: typeof HeroComposedChart = Object.assign(
  withDefaults(HeroComposedChart, {}),
  HeroComposedChart,
  {
    Bar: withDefaults(HeroComposedChart.Bar, ANIMATED),
    StackedBar: withDefaults(HeroComposedChart.StackedBar, ANIMATED),
    Line: withDefaults(HeroComposedChart.Line, ANIMATED),
    Area: withDefaults(HeroComposedChart.Area, ANIMATED),
    StackedArea: withDefaults(HeroComposedChart.StackedArea, ANIMATED),
    AreaRange: withDefaults(HeroComposedChart.AreaRange, ANIMATED),
  },
);
