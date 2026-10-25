/**
 * Stackra file contract:
 * Purpose: the page of the date-picker route: an empty picker and a filled one, a picker bounded to one month, an invalid
 *          picker holding a day that is refused (a weekend), a read-only and a disabled picker, and a live picker that
 *          shows the day it holds and whether its calendar is open, with a button that opens the calendar from outside, all
 *          from `@stackra/ui/react` with real props and `CalendarDate` values.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The calendar is an overlay, so while
 *           it is open the rest of the page is hidden from assistive technology.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0312; ADR 0318 (decision 7); ADR 0060
 *          (light, dark, RTL).
 */
import { CalendarDate } from "@internationalized/date";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { DatePickerRoute } from "#src/routes/date-picker/date-picker.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::date-picker.*` keys.
const STRINGS = {
  documentTitle: `${DatePickerRoute.title} · Stackra Playground`,
  intro:
    "A date picker is a date field with a button that opens a calendar. The day is typed into the field or chosen in the calendar, and both hold the same value: a day, with no time and no zone, or null when empty. The button has its own spoken name.",
  basics: "Basics",
  basicsNote: "An empty picker and a filled one.",
  empty: "Start date",
  emptyDescription: "Type a day or open the calendar.",
  emptyButton: "Choose the start date",
  filled: "Due date",
  filledDescription: "The day the invoice is due.",
  filledButton: "Choose the due date",
  bounded: "Bounded",
  boundedNote:
    "The calendar greys out every day outside the range, and a typed day outside it is invalid.",
  boundedLabel: "Booking date",
  boundedDescription: "Only days in March 2026 are accepted.",
  boundedMessage: "Pick a day in March 2026.",
  boundedButton: "Choose the booking date",
  states: "States",
  statesNote:
    "Invalid holds a Saturday, which the picker refuses through isDateUnavailable; the calendar shows weekends as unavailable. Read-only and disabled keep the day and cannot open.",
  invalid: "Delivery date",
  invalidMessage: "We do not deliver at weekends.",
  invalidButton: "Choose the delivery date",
  readOnly: "Signed on",
  disabled: "Cancelled on",
  live: "Try it",
  liveNote:
    "Choose a day in the calendar. The text below shows the day the picker holds and whether the calendar is open, and the button opens the calendar from outside.",
  liveLabel: "Check-in date",
  liveButton: "Choose the check-in date",
  liveEmpty: "No day chosen yet.",
  liveChosen: (day: CalendarDate) => `Chosen day: ${day.toString()}`,
  liveOpen: "The calendar is open.",
  liveClosed: "The calendar is closed.",
  openFromOutside: "Open the calendar",
} as const;

/** The grid that lays pickers out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

const MARCH_1 = new CalendarDate(2026, 3, 1);
const MARCH_31 = new CalendarDate(2026, 3, 31);

/** Saturdays and Sundays are refused: the day of the week in UTC, since a `CalendarDate` has no zone of its own. */
const isWeekend = (date: CalendarDate) => [0, 6].includes(date.toDate("UTC").getUTCDay());

/** The DatePicker page. */
export function DatePicker() {
  const [day, setDay] = useState<CalendarDate | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{DatePickerRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="date-picker-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={GRID}>
          <Ui.DatePicker
            label={STRINGS.empty}
            description={STRINGS.emptyDescription}
            calendarButtonLabel={STRINGS.emptyButton}
          />
          <Ui.DatePicker
            label={STRINGS.filled}
            description={STRINGS.filledDescription}
            calendarButtonLabel={STRINGS.filledButton}
            defaultValue={new CalendarDate(2026, 3, 5)}
          />
        </div>
      </PageSection>

      <PageSection id="date-picker-bounded" title={STRINGS.bounded} note={STRINGS.boundedNote}>
        <Ui.DatePicker
          label={STRINGS.boundedLabel}
          description={STRINGS.boundedDescription}
          errorMessage={STRINGS.boundedMessage}
          calendarButtonLabel={STRINGS.boundedButton}
          defaultValue={new CalendarDate(2026, 3, 15)}
          minValue={MARCH_1}
          maxValue={MARCH_31}
          validationBehavior="aria"
        />
      </PageSection>

      <PageSection id="date-picker-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={GRID}>
          <Ui.DatePicker
            label={STRINGS.invalid}
            errorMessage={STRINGS.invalidMessage}
            calendarButtonLabel={STRINGS.invalidButton}
            defaultValue={new CalendarDate(2026, 3, 7)}
            isDateUnavailable={isWeekend}
            validationBehavior="aria"
          />
          <Ui.DatePicker
            label={STRINGS.readOnly}
            defaultValue={new CalendarDate(2026, 2, 12)}
            isReadOnly
          />
          <Ui.DatePicker
            label={STRINGS.disabled}
            defaultValue={new CalendarDate(2026, 1, 20)}
            isDisabled
          />
        </div>
      </PageSection>

      <PageSection id="date-picker-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.DatePicker
          label={STRINGS.liveLabel}
          calendarButtonLabel={STRINGS.liveButton}
          value={day}
          onChange={setDay}
          // Where the calendar opens while the picker is empty, so the page reads the same on every day.
          placeholderValue={new CalendarDate(2026, 3, 5)}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Ui.Button variant="secondary" onPress={() => setIsOpen(true)}>
            {STRINGS.openFromOutside}
          </Ui.Button>
          <Ui.Text data-testid="date-picker-open" aria-live="polite">
            {isOpen ? STRINGS.liveOpen : STRINGS.liveClosed}
          </Ui.Text>
        </div>
        <Ui.Text data-testid="date-picker-value" aria-live="polite">
          {day === null ? STRINGS.liveEmpty : STRINGS.liveChosen(day)}
        </Ui.Text>
      </PageSection>
    </article>
  );
}
