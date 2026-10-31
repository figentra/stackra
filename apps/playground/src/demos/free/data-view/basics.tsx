/**
 * Stackra file contract:
 * Purpose: the "basics" demo of DataView: sixty Gulf orders under the whole toolbar (views, search, filter, sort, group, columns, density, Table / Grid / List / Cards, export, import, full screen), paged by ten.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import type { CollectionColumn } from "@stackra/ui/contracts";
import { DataView, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Waits `ms`, as a server round trip would. */
const later = <T,>(ms: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

/** The grid view's rules, on the engine's own columns: the order number is read-only, the numbers have a floor. */
const GRID_RULES: Readonly<Record<string, Partial<CollectionColumn>>> = {
  order: { isReadOnly: true },
  quantity: { min: 1 },
  total: { min: 0 },
};

/** The DataView demo: basics. */
export default function Basics() {
  const { orders, columns, renderCell, t, K } = useGulfOrders();
  const collection = useCollection({
    columns: columns.map((column) => ({ ...column, ...GRID_RULES[column.id] })),
    items: orders,
    paging: "page",
    initialState: { pageSize: 10 },
  });
  return (
    <DataView
      label={t(K.basics_label)}
      collection={collection}
      renderCell={renderCell}
      onGridSave={() => later(600, undefined)}
      list={{ subtitle: "customer", meta: "total" }}
      cards={{
        title: "customer",
        subtitle: "order",
        meta: "status",
        fields: ["city", "product", "quantity", "total"],
      }}
      exportOptions={{
        title: t(K.export_title),
        formats: [
          { value: "csv", label: t(K.format_csv) },
          { value: "xlsx", label: t(K.format_excel) },
        ],
        onExport: () => later(900, undefined),
      }}
      importOptions={{
        title: t(K.import_title),
        fields: columns.map((column) => ({ key: column.id, label: column.label })),
        onRead: () => later(500, { columns: ["Order", "Customer", "Total"], rowCount: 42 }),
        onDryRun: () => later(600, { created: 40, updated: 2, failed: 0, issues: [] }),
        onImport: () => later(900, undefined),
      }}
    />
  );
}
