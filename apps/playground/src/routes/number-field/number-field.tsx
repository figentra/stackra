/**
 * Stackra file contract:
 * Purpose: the page of the number-field route: a plain field, a bounded one, a percentage and a currency (the last two
 *          written by `formatOptions` in the language of the page), a field without buttons whose arrow keys still step
 *          it, the invalid, disabled and read-only states, and a live field that steps between one and ten seats and
 *          shows the value it holds, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0060 (light, dark,
 *          RTL).
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { NumberFieldRoute } from "#src/routes/number-field/number-field.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::number-field.*` keys.
const STRINGS = {
  documentTitle: `${NumberFieldRoute.title} · Stackra Playground`,
  intro:
    "A number field edits one number. It is typed, or stepped with its two buttons, the arrow keys or the mouse wheel; a typed value is moved to the nearest bound when the field loses focus, and the text is written and read in the language of the page. An empty field holds null.",
  basics: "Basics",
  basicsNote: "A plain field and one with bounds. The buttons stop at the ends of the range.",
  plain: "Quantity",
  plainDescription: "Type a number or step it with the buttons.",
  bounded: "Seats, 1 to 10",
  boundedDescription: "Type 40 and leave the field: it becomes 10.",
  formats: "Formats",
  formatsNote:
    "formatOptions turns the same number into a percentage or a price. The value held is the plain number: 0.15 and 1299.5.",
  percent: "Discount",
  percentDescription: "Held as a fraction, shown as a percentage.",
  currency: "Price",
  currencyDescription: "Dollars, in steps of fifty cents.",
  steppers: "Without buttons",
  steppersNote:
    "hasSteppers turned off hides the two buttons; the arrow keys still step the value.",
  noSteppers: "Years of experience",
  noSteppersDescription: "Press the up or down arrow key.",
  states: "States",
  statesNote: "Invalid shows the error message, disabled and read-only keep the value.",
  invalid: "Guests",
  invalidMessage: "Enter at least one guest.",
  disabled: "Rooms",
  readOnly: "Floors",
  live: "Try it",
  liveNote:
    "A field of one to ten seats. The text below it shows the number the field holds, or that it is empty.",
  liveLabel: "Seats to book",
  liveDescription: "Between one and ten.",
  liveEmpty: "No seats chosen yet.",
  liveChosen: (seats: number) => (seats === 1 ? "1 seat chosen." : `${seats} seats chosen.`),
} as const;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** The NumberField page. */
export function NumberField() {
  const [seats, setSeats] = useState<number | null>(4);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{NumberFieldRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="number-field-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={GRID}>
          <Ui.NumberField
            label={STRINGS.plain}
            description={STRINGS.plainDescription}
            defaultValue={2}
          />
          <Ui.NumberField
            label={STRINGS.bounded}
            description={STRINGS.boundedDescription}
            defaultValue={4}
            minValue={1}
            maxValue={10}
          />
        </div>
      </PageSection>

      <PageSection id="number-field-formats" title={STRINGS.formats} note={STRINGS.formatsNote}>
        <div className={GRID}>
          <Ui.NumberField
            label={STRINGS.percent}
            description={STRINGS.percentDescription}
            defaultValue={0.15}
            minValue={0}
            maxValue={1}
            step={0.05}
            formatOptions={{ style: "percent" }}
          />
          <Ui.NumberField
            label={STRINGS.currency}
            description={STRINGS.currencyDescription}
            defaultValue={1299.5}
            minValue={0}
            step={0.5}
            formatOptions={{ style: "currency", currency: "USD" }}
          />
        </div>
      </PageSection>

      <PageSection id="number-field-steppers" title={STRINGS.steppers} note={STRINGS.steppersNote}>
        <Ui.NumberField
          label={STRINGS.noSteppers}
          description={STRINGS.noSteppersDescription}
          defaultValue={3}
          minValue={0}
          hasSteppers={false}
        />
      </PageSection>

      <PageSection id="number-field-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={GRID}>
          <Ui.NumberField
            label={STRINGS.invalid}
            defaultValue={0}
            isInvalid
            errorMessage={STRINGS.invalidMessage}
          />
          <Ui.NumberField label={STRINGS.disabled} defaultValue={2} isDisabled />
          <Ui.NumberField label={STRINGS.readOnly} defaultValue={5} isReadOnly />
        </div>
      </PageSection>

      <PageSection id="number-field-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.NumberField
          label={STRINGS.liveLabel}
          description={STRINGS.liveDescription}
          value={seats}
          onChange={setSeats}
          minValue={1}
          maxValue={10}
        />
        <Ui.Text data-testid="number-field-value" aria-live="polite">
          {seats === null ? STRINGS.liveEmpty : STRINGS.liveChosen(seats)}
        </Ui.Text>
      </PageSection>
    </article>
  );
}
