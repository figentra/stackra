/**
 * Stackra file contract:
 * Purpose: the native `AreaChart` on HeroUI Native Pro's AreaChart: the area chart (a victory-native cartesian chart with area fills, stacked areas and range bands). HeroUI Native Pro's own component and
 *          every one of its props and parts, unchanged.
 * Boundary: no behaviour or styling of its own, because the Stackra props vocabulary names nothing a area chart takes
 *          (it draws on a Skia canvas, which has no accessible name, size or tone to map). It is re-exported so apps
 *          import every Pro component from this package; its hooks stay in `heroui-native-pro/area-chart`, and the generic props
 *          types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { AreaChart as HeroAreaChart } from "heroui-native-pro/area-chart";

/** The area chart (a victory-native cartesian chart with area fills, stacked areas and range bands): HeroUI Native Pro's own AreaChart, with every prop and part it has. */
export const AreaChart: typeof HeroAreaChart = HeroAreaChart;
