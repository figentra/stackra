/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web text-area: a reply Tamo can tidy, continue as ghost text or translate, and an empty description Tamo can draft (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { TextArea, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_KEYS } from "#src/demos/free/text-area/text-area-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_KEYS.text_area;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Text area: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TamoProvider client={CLIENT} screen="messages" screenLabel={t(K.tamo_screen)}>
      <div className="grid max-w-md gap-4">
        <TextArea
          label={t(K.tamo_reply_label)}
          name="reply"
          defaultValue={t(K.tamo_reply)}
          rows={3}
        />
        <TextArea
          label={t(K.tamo_empty_label)}
          name="description"
          description={t(K.tamo_empty_hint)}
          rows={3}
        />
      </div>
    </TamoProvider>
  );
}
