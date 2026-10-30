/**
 * Stackra file contract:
 * Purpose: the "presets" demo of the web DatePicker: quick dates (Today, Tomorrow, In 7 days…) beside the calendar.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { DatePreset } from "@stackra/ui/contracts";
import { DatePicker, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_PRESETS_KEYS } from "#src/demos/free/date-picker/date-picker-presets-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_PRESETS_KEYS.date_picker_presets;

/** Date picker: quick dates beside the calendar. */
export default function Presets() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <DatePicker
      className="max-w-xs"
      label={t(K.label)}
      description={t(K.hint)}
      presets={DatePreset}
    />
  );
}
