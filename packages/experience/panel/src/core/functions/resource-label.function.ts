/**
 * Stackra file contract:
 * Purpose: `resourceLabel(key, part, name?)`, the derived label key of a resource's part
 *          (`<module>::resources.<model>.<part>.<name>`), so no column, entry, field or action takes a label option.
 * Boundary: internal; pure string work, no catalogue read.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 6: derived labels); the `widgetTitle` precedent.
 */
import type { I18nKey } from "@stackra/i18n";

/**
 * The label key of `name` in `part` of the resource `key`; without `name`, the part itself (`title`).
 *
 * @example
 * resourceLabel("orders.order", "columns", "totals.totalMinor"); // "orders::resources.order.columns.totals_total_minor"
 * resourceLabel("orders.order", "title"); // "orders::resources.order.title"
 */
export function resourceLabel(key: string, part: string, name?: string): I18nKey {
  const dot = key.indexOf(".");
  const leaf =
    name === undefined
      ? ""
      : `.${name
          .replaceAll(".", "_")
          .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
          .toLowerCase()}`;
  return `${key.slice(0, dot)}::resources.${key.slice(dot + 1)}.${part}${leaf}` as I18nKey;
}
