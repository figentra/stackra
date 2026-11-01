/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web filter-bar: Ask Tamo on the filter bar: words become proposed chips and a sort, applied on Apply (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { DataTable, FilterBar, Text, useCatalogueText, useCollection } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";
import { FILTER_BAR_KEYS } from "#src/demos/free/filter-bar/filter-bar-keys.constant";

/** The demo's keys. */
const K = FILTER_BAR_KEYS.filter_bar.tamo;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Filter bar: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  const { orders, columns, renderCell } = useGulfOrders(24);
  const collection = useCollection({
    items: orders,
    columns,
    paging: "page",
    initialState: { pageSize: 6 },
  });
  return (
    <TamoProvider client={CLIENT} screen="orders" screenLabel={t(K.screen)}>
      <div className="grid gap-3">
        <Text type="small" tone="muted">
          {t(K.hint)}
        </Text>
        <DataTable
          label={t(K.label)}
          collection={collection}
          renderCell={renderCell}
          ai={false}
          filterBar={<FilterBar collection={collection} searchLabel={t(K.search)} />}
        />
      </div>
    </TamoProvider>
  );
}
