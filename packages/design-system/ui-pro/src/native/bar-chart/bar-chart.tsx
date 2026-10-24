/**
 * Stackra file contract:
 * Purpose: the native `BarChart` on HeroUI Native Pro's BarChart: the bar chart (bars, grouped bars and stacked bars).
 *          HeroUI Native Pro's own component and every one of its props and parts, except that `Bar` and `StackedBar`
 *          move to new data on the theme's reveal step by default instead of jumping (ADR 0329).
 * Boundary: no styling of its own, because the Stackra props vocabulary names nothing a bar chart takes (it draws on a
 *           Skia canvas, which has no accessible name, size or tone to map). A caller's `animate` wins, and the root's
 *           `animation="disable-all"` still stills every series. Its hooks stay in `heroui-native-pro/bar-chart`, and
 *           the generic props types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { BarChart as HeroBarChart } from "heroui-native-pro/bar-chart";

import { CHART_SERIES_ANIMATE } from "#native/chart-series/chart-series-animate.constant";
import { withDefaults } from "#native/chart-series/with-defaults.function";

const ANIMATED = { animate: CHART_SERIES_ANIMATE };

/** The bar chart: HeroUI Native Pro's own BarChart, with every prop and part it has, its series animating to new data. */
// shortcut: `BarGroupItem` keeps HeroUI's still default, because `BarGroup` reads its items' props without rendering
// them; give each item `animate`, or clone the items in a `BarGroup` copy if grouped bars become common.
export const BarChart: typeof HeroBarChart = Object.assign(
  withDefaults(HeroBarChart, {}),
  HeroBarChart,
  {
    Bar: withDefaults(HeroBarChart.Bar, ANIMATED),
    StackedBar: withDefaults(HeroBarChart.StackedBar, ANIMATED),
  },
);
