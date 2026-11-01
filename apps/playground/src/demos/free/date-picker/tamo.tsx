/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web date-picker: a delivery day picked in words: open the calendar and write next Friday (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { DatePicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_KEYS } from "#src/demos/free/date-picker/date-picker-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_KEYS.date_picker;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Date picker: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TamoProvider client={CLIENT} screen="order" screenLabel={t(K.tamo_screen)}>
      <div className="max-w-xs">
        <DatePicker label={t(K.tamo_label)} name="delivery" description={t(K.tamo_hint)} />
      </div>
    </TamoProvider>
  );
}
