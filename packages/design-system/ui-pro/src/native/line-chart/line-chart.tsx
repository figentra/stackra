/**
 * Stackra file contract:
 * Purpose: the native `LineChart` on HeroUI Native Pro's LineChart: the line chart. HeroUI Native Pro's own component and
 *          every one of its props and parts, unchanged.
 * Boundary: no behaviour or styling of its own, because the Stackra props vocabulary names nothing a line chart takes
 *          (it draws on a Skia canvas, which has no accessible name, size or tone to map). It is re-exported so apps
 *          import every Pro component from this package; its hooks stay in `heroui-native-pro/line-chart`, and the generic props
 *          types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { LineChart as HeroLineChart } from "heroui-native-pro/line-chart";

/** The line chart: HeroUI Native Pro's own LineChart, with every prop and part it has. */
export const LineChart: typeof HeroLineChart = HeroLineChart;
