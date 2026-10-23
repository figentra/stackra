/**
 * Stackra file contract:
 * Purpose: the native `BarChart` on HeroUI Native Pro's BarChart: the bar chart (bars, grouped bars and stacked bars). HeroUI Native Pro's own component and
 *          every one of its props and parts, unchanged.
 * Boundary: no behaviour or styling of its own, because the Stackra props vocabulary names nothing a bar chart takes
 *          (it draws on a Skia canvas, which has no accessible name, size or tone to map). It is re-exported so apps
 *          import every Pro component from this package; its hooks stay in `heroui-native-pro/bar-chart`, and the generic props
 *          types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { BarChart as HeroBarChart } from "heroui-native-pro/bar-chart";

/** The bar chart (bars, grouped bars and stacked bars): HeroUI Native Pro's own BarChart, with every prop and part it has. */
export const BarChart: typeof HeroBarChart = HeroBarChart;
