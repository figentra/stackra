/**
 * Stackra file contract:
 * Purpose: the "date" demo of the web Wheel picker: A day on wheels.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { Text, WheelDatePicker, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { WHEEL_PICKER_KEYS } from "#src/demos/free/wheel-picker/wheel-picker-keys.constant";

/** The demo's keys. */
const K = WHEEL_PICKER_KEYS.wheel_picker.date;

/** Wheel picker: A day on wheels. */
export default function Date() {
  const t = useCatalogueText(MESSAGES.en);
  const [day, setDay] = useState(new CalendarDate(2026, 3, 18));
  return (
    <div className="grid gap-4">
      <WheelDatePicker
        label={t(K.label)}
        value={day}
        onChange={setDay}
        minYear={1950}
        maxYear={2030}
      />
      <Text tone="muted">{t(K.chosen, { day: day.toString() })}</Text>
    </div>
  );
}
