/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web data-table: a table with Tamo's tools: select rows to summarise them, fill a column or filter in words (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { DataTable, Text, useCatalogueText, useCollection } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATA_TABLE_KEYS } from "#src/demos/free/data-table/data-table-keys.constant";
import { useGulfOrders } from "#src/demos/free/data-view/use-gulf-orders";

/** The demo's keys. */
const K = DATA_TABLE_KEYS.data_table;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Data table: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  const { orders, columns, renderCell } = useGulfOrders(12);
  const collection = useCollection({ items: orders, columns });
  return (
    <TamoProvider client={CLIENT} screen="orders" screenLabel={t(K.tamo_screen)}>
      <div className="grid gap-3">
        <Text type="small" tone="muted">
          {t(K.tamo_hint)}
        </Text>
        <DataTable
          label={t(K.tamo_label)}
          collection={collection}
          renderCell={renderCell}
          selectionMode="multiple"
          onCellEdit={() => undefined}
        />
      </div>
    </TamoProvider>
  );
}
