/**
 * Stackra file contract:
 * Purpose: `documentLabel(key, part)`, the derived label key of a panel document: `<module>::documents.<name>.<part>`,
 *          from its key `<module>.<name>` (`title` for its page header and its navigation entry).
 * Boundary: pure; the key is checked by `document(key, options)`. Gen lists the keys it derives so the catalogues hold
 *           them, as it does for resources (ADR 0307 rule 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 20); build-list item 53 (STA-1981).
 */
import type { I18nKey } from "@stackra/i18n";

/**
 * The label key of `part` of the document `key`.
 *
 * @example
 * documentLabel("orders.sales_overview", "title"); // "orders::documents.sales_overview.title"
 */
export function documentLabel(key: string, part: string): I18nKey {
  const dot = key.indexOf(".");
  return `${key.slice(0, dot)}::documents.${key.slice(dot + 1)}.${part}` as I18nKey;
}
