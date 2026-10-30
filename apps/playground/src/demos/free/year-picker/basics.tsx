/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Year picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { Text, YearPicker, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { YEAR_PICKER_KEYS } from "#src/demos/free/year-picker/year-picker-keys.constant";

/** The demo's keys. */
const K = YEAR_PICKER_KEYS.year_picker.basics;

/** Year picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [year, setYear] = useState(2024);
  return (
    <div className="grid gap-4">
      <YearPicker
        label={t(K.label)}
        minYear={2015}
        maxYear={2027}
        value={year}
        onChange={setYear}
      />
      <Text tone="muted">{t(K.chosen, { year: String(year) })}</Text>
    </div>
  );
}
