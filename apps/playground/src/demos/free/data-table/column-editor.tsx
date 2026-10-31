/**
 * Stackra file contract:
 * Purpose: the "column-editor" demo of the web DataTable: the column editor beside the table: drag (or the keyboard) to reorder, tick to show, rename, pin, set the width or fit it, wrap, reset.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { ColumnEditor, DataTable, useCollection } from "@stackra/ui/react";

import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** Data table: Column editor. */
export default function ColumnEditorDemo() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(12);
  const collection = useCollection({ columns, items: orders });
  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <ColumnEditor collection={collection} />
      </div>
      <DataTable
        label={t(K.editor_label)}
        collection={collection}
        renderCell={renderCell}
        hasColumnTools
        isStickyHeader
        maxHeight="22rem"
      />
    </div>
  );
}
