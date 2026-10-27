/**
 * Stackra file contract:
 * Purpose: the page of the date-field route: an empty field and a filled one, a field bounded to one month, an invalid
 *          field holding a day that is refused (a weekend) and so flagged by the field's own rule, a read-only and a
 *          disabled field, and a live field that shows the day it holds, all from `@stackra/ui/react` with real props and
 *          `CalendarDate` values.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The order of the segments and the
 *           digits follow the locale the page is shown in.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0318 (decision 7); ADR 0060 (light, dark,
 *          RTL).
 */
import { CalendarDate } from "@internationalized/date";
import { DateField as UiDateField, Heading, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { DateFieldRoute } from "#src/routes/date-field/date-field.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::date-field.*` keys.
const STRINGS = {
  documentTitle: `${DateFieldRoute.title} · Stackra Playground`,
  intro:
    "A date field edits one calendar day, typed into three segments (month, day and year in the order of the language). The up and down arrow keys step the segment that has focus. An empty field holds null; the value is a day, with no time and no zone.",
  basics: "Basics",
  basicsNote: "An empty field and a filled one.",
  empty: "Start date",
  emptyDescription: "Type the month, the day and the year.",
  filled: "Due date",
  filledDescription: "The day the invoice is due.",
  bounded: "Bounded",
  boundedNote: "A day before the earliest or after the latest is invalid.",
  boundedLabel: "Booking date",
  boundedDescription: "Only days in March 2026 are accepted.",
  boundedMessage: "Pick a day in March 2026.",
  states: "States",
  statesNote:
    "Invalid holds a Saturday, which the field refuses through isDateUnavailable. Read-only and disabled keep the day.",
  invalid: "Delivery date",
  invalidMessage: "We do not deliver at weekends.",
  readOnly: "Signed on",
  disabled: "Cancelled on",
  live: "Try it",
  liveNote:
    "Type a day, or step a segment with the arrow keys. The text below it shows the day the field holds.",
  liveLabel: "Check-in date",
  liveEmpty: "No day chosen yet.",
  liveChosen: (day: CalendarDate) => `Chosen day: ${day.toString()}`,
} as const;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

const MARCH_1 = new CalendarDate(2026, 3, 1);
const MARCH_31 = new CalendarDate(2026, 3, 31);

/** Saturdays and Sundays are refused: the day of the week in UTC, since a `CalendarDate` has no zone of its own. */
const isWeekend = (date: CalendarDate) => [0, 6].includes(date.toDate("UTC").getUTCDay());

/** The DateField page. */
export function DateField() {
  const [day, setDay] = useState<CalendarDate | null>(null);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{DateFieldRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="date-field-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={GRID}>
          <UiDateField label={STRINGS.empty} description={STRINGS.emptyDescription} />
          <UiDateField
            label={STRINGS.filled}
            description={STRINGS.filledDescription}
            defaultValue={new CalendarDate(2026, 3, 5)}
          />
        </div>
      </PageSection>

      <PageSection id="date-field-bounded" title={STRINGS.bounded} note={STRINGS.boundedNote}>
        <UiDateField
          label={STRINGS.boundedLabel}
          description={STRINGS.boundedDescription}
          errorMessage={STRINGS.boundedMessage}
          defaultValue={new CalendarDate(2026, 3, 15)}
          minValue={MARCH_1}
          maxValue={MARCH_31}
          validationBehavior="aria"
        />
      </PageSection>

      <PageSection id="date-field-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={GRID}>
          <UiDateField
            label={STRINGS.invalid}
            errorMessage={STRINGS.invalidMessage}
            defaultValue={new CalendarDate(2026, 3, 7)}
            isDateUnavailable={isWeekend}
            validationBehavior="aria"
          />
          <UiDateField
            label={STRINGS.readOnly}
            defaultValue={new CalendarDate(2026, 2, 12)}
            isReadOnly
          />
          <UiDateField
            label={STRINGS.disabled}
            defaultValue={new CalendarDate(2026, 1, 20)}
            isDisabled
          />
        </div>
      </PageSection>

      <PageSection id="date-field-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiDateField label={STRINGS.liveLabel} value={day} onChange={setDay} />
        <Text data-testid="date-field-value" aria-live="polite">
          {day === null ? STRINGS.liveEmpty : STRINGS.liveChosen(day)}
        </Text>
      </PageSection>
    </article>
  );
}
