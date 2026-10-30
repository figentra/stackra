/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Date field: Type a day, or step a segment with the arrow keys. The text below
 *          it shows the day the field holds.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { CalendarDate } from "@internationalized/date";
import { DateField as UiDateField, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_FIELD_KEYS } from "#src/demos/free/date-field/date-field-keys.constant";

/** The demo's keys. */
const K = DATE_FIELD_KEYS.date_field;

/** Date field: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [day, setDay] = useState<CalendarDate | null>(null);

  return (
    <div className="grid gap-6">
      <UiDateField label={t(K.live_label)} value={day} onChange={setDay} />
      <Text data-testid="date-field-value" aria-live="polite">
        {day === null ? t(K.live_empty) : t(K.live_chosen, { day: day.toString() })}
      </Text>
    </div>
  );
}
