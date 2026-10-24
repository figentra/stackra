/**
 * Stackra file contract:
 * Purpose: the native `AreaChart` on HeroUI Native Pro's AreaChart: the area chart (a victory-native cartesian chart
 *          with area fills, stacked areas and range bands). HeroUI Native Pro's own component and every one of its
 *          props and parts, except that its series (`Area`, `StackedArea`, `AreaRange`) move to new data on the
 *          theme's reveal step by default instead of jumping (ADR 0329).
 * Boundary: no styling of its own, because the Stackra props vocabulary names nothing an area chart takes (it draws on
 *           a Skia canvas, which has no accessible name, size or tone to map). A caller's `animate` wins, and the
 *           root's `animation="disable-all"` still stills every series. Its hooks stay in `heroui-native-pro/area-chart`,
 *           and the generic props types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { AreaChart as HeroAreaChart } from "heroui-native-pro/area-chart";

import { CHART_SERIES_ANIMATE } from "#native/chart-series/chart-series-animate.constant";
import { withDefaults } from "#native/chart-series/with-defaults.function";

const ANIMATED = { animate: CHART_SERIES_ANIMATE };

/** The area chart: HeroUI Native Pro's own AreaChart, with every prop and part it has, its series animating to new data. */
export const AreaChart: typeof HeroAreaChart = Object.assign(
  withDefaults(HeroAreaChart, {}),
  HeroAreaChart,
  {
    Area: withDefaults(HeroAreaChart.Area, ANIMATED),
    StackedArea: withDefaults(HeroAreaChart.StackedArea, ANIMATED),
    AreaRange: withDefaults(HeroAreaChart.AreaRange, ANIMATED),
  },
);
