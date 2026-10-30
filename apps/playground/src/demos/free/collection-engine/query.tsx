/**
 * Stackra file contract:
 * Purpose: the "query" demo of the collection engine: a DataView in server mode with no fetcher, showing the plain query object the engine emits on every change of search, filter, sort, group or page.
 * Boundary: a demo with no props: @stackra/ui, the shared Gulf orders and local state only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); data-collection plan (owner,
 *          2026-10-29); ADR 0060 (light, dark, RTL).
 */
import { CodeBlock, DataView, useCatalogueText, useCollection } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { COLLECTION_ENGINE_KEYS } from "#src/demos/free/collection-engine/collection-engine-keys.constant";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The words. */
const E = COLLECTION_ENGINE_KEYS.collection_engine;

/** Collection engine: The query object. */
export default function Query() {
  const words = useCatalogueText(MESSAGES.en);
  const { orders, columns, renderCell, t, K } = useGulfOrders(10);
  const collection = useCollection({
    columns,
    items: orders,
    mode: "server",
    paging: "cursor",
    totalCount: 240,
  });
  return (
    <div className="grid w-full gap-3">
      <DataView
        label={t(K.orders)}
        collection={collection}
        renderCell={renderCell}
        layouts={["table", "list"]}
      />
      <CodeBlock
        title={words(E.query)}
        language="json"
        code={JSON.stringify(collection.query, null, 2)}
      />
    </div>
  );
}
