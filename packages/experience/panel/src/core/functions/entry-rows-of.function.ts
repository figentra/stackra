/**
 * Stackra file contract:
 * Purpose: `entryRowsOf(resourceKey, entries, record, t)`, one level of a View page's infolist as data: a property
 *          row per entry (a value, or a list as a small table whose `…Minor` cells take their currency) and each
 *          section with its title and its own entries.
 * Boundary: internal: pure; the web and native View pages draw the rows with their own property list, table and
 *           `ResourceValue`, and each section's entries one level down.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 2); ADR 0164.
 */
import type { I18nKey } from "@stackra/i18n";

import { listCellCurrency } from "#core/functions/list-cell-currency.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { valueAt } from "#core/functions/value-at.function";
import type { EntryNode } from "#core/types/entry-node.type";
import type { EntryRow } from "#core/types/entry-row.type";

/**
 * The rows and sections of `entries` over `record`.
 *
 * @example
 * const { rows, sections } = entryRowsOf("orders.order", tree.infolist.entries, order, t);
 */
export function entryRowsOf(
  resourceKey: string,
  entries: readonly EntryNode[],
  record: object,
  t: (key: I18nKey) => string,
): {
  readonly rows: readonly EntryRow[];
  readonly sections: readonly {
    readonly name: string;
    readonly title: string;
    readonly entries: readonly EntryNode[];
  }[];
} {
  const rows: EntryRow[] = [];
  const sections: { name: string; title: string; entries: readonly EntryNode[] }[] = [];
  for (const entry of entries) {
    if (entry.kind === "section") {
      sections.push({
        name: entry.name,
        title: t(resourceLabel(resourceKey, "sections", entry.name)),
        entries: entry.entries,
      });
      continue;
    }
    const label = t(resourceLabel(resourceKey, "entries", entry.key));
    const value = valueAt(record, entry.key);
    if (entry.kind !== "list") {
      rows.push({
        id: entry.key,
        label,
        cell: {
          resourceKey,
          path: entry.key,
          kind: entry.kind,
          value,
          currency: entry.kind === "money" ? valueAt(record, entry.currency) : undefined,
          labels: entry.kind === "value" ? entry.labels : undefined,
        },
      });
      continue;
    }
    rows.push({
      id: entry.key,
      label,
      list: {
        columns: entry.columns.map((column) => ({
          id: column,
          label: t(resourceLabel(resourceKey, "entries", `${entry.key}.${column}`)),
        })),
        items: (Array.isArray(value) ? (value as object[]) : []).map((item, index) => ({
          ...item,
          id: String(index),
        })),
        cell: (item, columnId) => {
          const currency = listCellCurrency(item, columnId, record, entry.currency);
          return {
            resourceKey,
            path: columnId,
            kind: currency === undefined ? "value" : "money",
            value: valueAt(item, columnId),
            currency,
            labels: entry.labels?.[columnId],
          };
        },
      },
    });
  }
  return { rows, sections };
}
