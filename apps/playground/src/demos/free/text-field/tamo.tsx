/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web text-field: a message field with Ask Tamo: hover or focus it to rewrite, shorten, translate or change the tone (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { TextField, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_KEYS } from "#src/demos/free/text-field/text-field-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_KEYS.text_field;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Text field: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TamoProvider client={CLIENT} screen="order" screenLabel={t(K.tamo_screen)}>
      <div className="max-w-md">
        <TextField
          label={t(K.tamo_label)}
          name="message"
          defaultValue={t(K.tamo_text)}
          description={t(K.tamo_hint)}
        />
      </div>
    </TamoProvider>
  );
}
