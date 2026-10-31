/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web data-view: DataView with Tamo in its toolbar: filter and sort in words, summarise, fill a column into the grid's save (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { DataView, useCatalogueText, useCollection } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_VIEW_KEYS } from "#src/demos/free/data-view/data-view-keys.constant";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The demo's keys. */
const K = DATA_VIEW_KEYS.data_view;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Data view: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  const { orders, columns, renderCell } = useGulfOrders(24);
  const collection = useCollection({
    items: orders,
    columns,
    paging: "page",
    initialState: { pageSize: 8 },
  });
  return (
    <TamoProvider client={CLIENT} screen="orders" screenLabel={t(K.tamo_screen)}>
      <DataView
        label={t(K.tamo_label)}
        collection={collection}
        renderCell={renderCell}
        selectionMode="multiple"
        onGridSave={() => undefined}
      />
    </TamoProvider>
  );
}
