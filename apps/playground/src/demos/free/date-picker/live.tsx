/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Date picker: Choose a day in the calendar. The text below shows the day the
 *          picker holds and whether the calendar is open, and the button opens the calendar from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0318 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { Button, DatePicker as UiDatePicker, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_KEYS } from "#src/demos/free/date-picker/date-picker-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_KEYS.date_picker;

/** Date picker: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [day, setDay] = useState<CalendarDate | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="grid gap-6">
      <UiDatePicker
        label={t(K.live_label)}
        calendarButtonLabel={t(K.live_button)}
        value={day}
        onChange={setDay}
        // Where the calendar opens while the picker is empty, so the page reads the same on every day.
        placeholderValue={new CalendarDate(2026, 3, 5)}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onPress={() => setIsOpen(true)}>
          {t(K.open_from_outside)}
        </Button>
        <Text data-testid="date-picker-open" aria-live="polite">
          {isOpen ? t(K.live_open) : t(K.live_closed)}
        </Text>
      </div>
      <Text data-testid="date-picker-value" aria-live="polite">
        {day === null ? t(K.live_empty) : t(K.live_chosen, { day: day.toString() })}
      </Text>
    </div>
  );
}
