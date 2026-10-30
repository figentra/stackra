/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of DataView: the same orders in Arabic, right to left, whatever the page's locale: the toolbar, the pinned order column at the right, the drag and the drop line mirrored.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { Bidi, DataView, useCollection } from "@stackra/ui/react";

import { ShowcaseI18n } from "#src/components/showcase-i18n/showcase-i18n";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** DataView: Arabic, right to left. */
export default function Arabic() {
  return (
    // The words in Arabic, and a right-to-left block that gives React Aria an Arabic locale for its keys and drag.
    <ShowcaseI18n locale="ar">
      <Bidi isBlock dir="rtl" lang="ar">
        <Orders />
      </Bidi>
    </ShowcaseI18n>
  );
}

/** The orders, in the Arabic words of the provider above. */
function Orders() {
  const { orders, columns, renderCell, t, K } = useGulfOrders(30);
  const collection = useCollection({
    columns,
    items: orders,
    locale: "ar",
    paging: "page",
    initialState: {
      pageSize: 8,
      columns: columns.map((column) => ({ id: column.id, ...(column.id === "order" ? { pin: "start" as const } : {}) })),
      sort: [{ column: "total", direction: "descending" }],
    },
  });
  return (
    <DataView
      label={t(K.arabic_label)}
      collection={collection}
      renderCell={renderCell}
      cards={{ title: "customer", subtitle: "order", meta: "total" }}
    />
  );
}
