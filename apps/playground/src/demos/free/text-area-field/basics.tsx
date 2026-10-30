/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Text area field: a note with its hint, and a filled reason.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { TextAreaField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_FIELD_KEYS } from "#src/demos/free/text-area-field/text-area-field-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_FIELD_KEYS.text_area_field;

/** Text area field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextAreaField name="note" label={t(K.note)} description={t(K.note_hint)} rows={3} />
      <TextAreaField name="reason" label={t(K.reason)} defaultValue={t(K.reason_value)} rows={3} />
    </div>
  );
}
