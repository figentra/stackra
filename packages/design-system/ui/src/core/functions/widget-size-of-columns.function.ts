/**
 * Stackra file contract:
 * Purpose: `widgetSizeOfColumns`, the widget size nearest to a span of a 12-column grid: small 3, medium 6, large 9,
 *          full 12. A dashboard tile's resize handle snaps to it as it is dragged.
 * Boundary: pure. Any number is accepted; spans past either end take the nearest end.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 16 and 18); STA-1371.
 */
import { WidgetSize } from "#contracts/enums/widget-size.enum";

/**
 * The size whose span is nearest `columns`; a tie takes the larger size.
 * @example widgetSizeOfColumns(7.2); // "medium"
 */
export function widgetSizeOfColumns(columns: number): WidgetSize {
  const step = Math.round(columns / 3) - 1;
  return WidgetSize[Math.min(Math.max(step, 0), WidgetSize.length - 1)] ?? "medium";
}
