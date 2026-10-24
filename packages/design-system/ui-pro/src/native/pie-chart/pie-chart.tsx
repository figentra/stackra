/**
 * Stackra file contract:
 * Purpose: the native `PieChart` on HeroUI Native Pro's PieChart: the pie chart. HeroUI Native Pro's own component and
 *          every one of its props and parts, except that `Slice` and `SliceAngularInset` move to new data on the
 *          theme's reveal step by default instead of jumping (ADR 0329).
 * Boundary: no styling of its own, because the Stackra props vocabulary names nothing a pie chart takes (it draws on a
 *           Skia canvas, which has no accessible name, size or tone to map). A caller's `animate` wins, and the root's
 *           `animation="disable-all"` still stills every slice. Its hooks stay in `heroui-native-pro/pie-chart`, and
 *           the generic props types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { PieChart as HeroPieChart } from "heroui-native-pro/pie-chart";

import { CHART_SERIES_ANIMATE } from "#native/chart-series/chart-series-animate.constant";
import { withDefaults } from "#native/chart-series/with-defaults.function";

const ANIMATED = { animate: CHART_SERIES_ANIMATE };

/** The pie chart: HeroUI Native Pro's own PieChart, with every prop and part it has, its slices animating to new data. */
export const PieChart: typeof HeroPieChart = Object.assign(
  withDefaults(HeroPieChart, {}),
  HeroPieChart,
  {
    Slice: withDefaults(HeroPieChart.Slice, ANIMATED),
    SliceAngularInset: withDefaults(HeroPieChart.SliceAngularInset, ANIMATED),
  },
);
