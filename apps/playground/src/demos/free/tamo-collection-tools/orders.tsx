/**
 * Stackra file contract:
 * Purpose: the "orders" demo of the web tamo-collection-tools: Tamo's table tools over Gulf orders: filter in words, summarise the selected rows, fill a column.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import {
  DataTable,
  TamoCollectionTools,
  Text,
  useCatalogueText,
  useCollection,
} from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";
import { TAMO_COLLECTION_TOOLS_KEYS } from "#src/demos/free/tamo-collection-tools/tamo-collection-tools-keys.constant";

/** The demo's keys. */
const K = TAMO_COLLECTION_TOOLS_KEYS.tamo_collection_tools;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Tamo collection tools: orders. */
export default function Orders() {
  const t = useCatalogueText(MESSAGES.en);
  const { orders, columns, renderCell } = useGulfOrders(12);
  const collection = useCollection({ items: orders, columns });
  const [filled, setFilled] = useState(0);
  return (
    <TamoProvider client={CLIENT} screen="orders" screenLabel={t(K.screen)}>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text type="small" tone="muted">
            {t(K.hint)}
          </Text>
          <TamoCollectionTools
            collection={collection}
            label={t(K.label)}
            onFill={(changes) => setFilled(Object.keys(changes).length)}
          />
        </div>
        <DataTable
          label={t(K.label)}
          collection={collection}
          renderCell={renderCell}
          selectionMode="multiple"
          ai={false}
        />
        <Text type="small" tone="muted" role="status">
          {filled === 0 ? "" : t(K.filled, { count: filled })}
        </Text>
      </div>
    </TamoProvider>
  );
}
