/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the web Year picker: Hijri years.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { YearPicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { YEAR_PICKER_KEYS } from "#src/demos/free/year-picker/year-picker-keys.constant";

/** The demo's keys. */
const K = YEAR_PICKER_KEYS.year_picker.hijri;

/** Year picker: Hijri years. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <YearPicker
        label={t(K.label)}
        calendar="islamic-umalqura"
        minYear={2023}
        maxYear={2028}
        defaultValue={2026}
      />
    </div>
  );
}
