/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web date-range-picker: a report period picked in words: open the calendar and write last month (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { DateRangePicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_RANGE_PICKER_KEYS } from "#src/demos/free/date-range-picker/date-range-picker-keys.constant";

/** The demo's keys. */
const K = DATE_RANGE_PICKER_KEYS.date_range_picker.tamo;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Date range picker: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TamoProvider client={CLIENT} screen="reports" screenLabel={t(K.screen)}>
      <div className="max-w-sm">
        <DateRangePicker label={t(K.label)} name="period" description={t(K.hint)} />
      </div>
    </TamoProvider>
  );
}
