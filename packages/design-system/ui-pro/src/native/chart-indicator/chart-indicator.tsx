/**
 * Stackra file contract:
 * Purpose: the native `ChartIndicator` on HeroUI Native Pro's ChartIndicator: the dot that follows the pressed point inside a chart canvas. HeroUI Native Pro's own component and
 *          every one of its props and parts, unchanged.
 * Boundary: no behaviour or styling of its own, because the Stackra props vocabulary names nothing a chart indicator takes
 *          (it draws on a Skia canvas, which has no accessible name, size or tone to map). It is re-exported so apps
 *          import every Pro component from this package; its hooks stay in `heroui-native-pro/chart-indicator`, and the generic props
 *          types are HeroUI Native Pro's own.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { ChartIndicator as HeroChartIndicator } from "heroui-native-pro/chart-indicator";

/** The dot that follows the pressed point inside a chart canvas: HeroUI Native Pro's own ChartIndicator, with every prop and part it has. */
export const ChartIndicator: typeof HeroChartIndicator = HeroChartIndicator;
