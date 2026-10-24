/**
 * Stackra file contract:
 * Purpose: the web `ChartTooltip` on HeroUI Pro's ChartTooltip (the card a chart shows for a hovered point): HeroUI
 *          Pro's own compound, with its parts Root, Content, Header, Item, Indicator, Label and Value, unchanged.
 * Boundary: no behaviour or styling of its own, because the Stackra props vocabulary names nothing it takes (its
 *          `label` is a data label, not an accessible name, and its `color` is a CSS colour, not a tone). It is
 *          re-exported so apps import every Pro component from this package. Imports the `chart-tooltip` subpath,
 *          the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-001.
 */
import { ChartTooltip as HeroChartTooltip } from "@heroui-pro/react/chart-tooltip";

/** The tooltip card: HeroUI Pro's own ChartTooltip, with every prop and part it has. */
export const ChartTooltip: typeof HeroChartTooltip = HeroChartTooltip;
