/**
 * Stackra file contract:
 * Purpose: `widgetTitle`, the derived label key of a widget or one of its parts (`orders.order_kpis` with `title` is
 *          `orders::widgets.order_kpis.title`; with `revenue`, the KPI's label).
 * Boundary: internal: pure; no entry exports it. Gen checks every derived key exists in every base locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 6: derived label keys); ADR 0231 (`<module>::<path>`).
 */
import type { I18nKey } from "@stackra/i18n";

/**
 * The label key of `part` of the widget `key`.
 *
 * @example
 * widgetTitle("orders.order_kpis", "revenue"); // "orders::widgets.order_kpis.revenue"
 */
export function widgetTitle(key: string, part = "title"): I18nKey {
  const dot = key.indexOf(".");
  return `${key.slice(0, dot)}::widgets.${key.slice(dot + 1)}.${part}` as I18nKey;
}
