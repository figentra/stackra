/**
 * Stackra file contract:
 * Purpose: the native `LineChart` on HeroUI Native Pro's LineChart: the line chart. HeroUI Native Pro's own component
 *          and every one of its props and parts, except that `Line` moves to new data on the theme's reveal step by
 *          default instead of jumping (ADR 0329). `AnimatedLine`, the draw-on entrance, is HeroUI Native Pro's own.
 * Boundary: no styling of its own, because the Stackra props vocabulary names nothing a line chart takes (it draws on a
 *           Skia canvas, which has no accessible name, size or tone to map). A caller's `animate` wins, and the root's
 *           `animation="disable-all"` still stills every series. Its hooks stay in `heroui-native-pro/line-chart`, and
 *           the generic props types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { LineChart as HeroLineChart } from "heroui-native-pro/line-chart";

import { CHART_SERIES_ANIMATE } from "#native/chart-series/chart-series-animate.constant";
import { withDefaults } from "#native/chart-series/with-defaults.function";

/** The line chart: HeroUI Native Pro's own LineChart, with every prop and part it has, its line animating to new data. */
export const LineChart: typeof HeroLineChart = Object.assign(
  withDefaults(HeroLineChart, {}),
  HeroLineChart,
  {
    Line: withDefaults(HeroLineChart.Line, { animate: CHART_SERIES_ANIMATE }),
  },
);
