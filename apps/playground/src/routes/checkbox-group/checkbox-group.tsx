/**
 * Stackra file contract:
 * Purpose: the page of the checkbox-group route: a labelled group with descriptions, the group states (disabled, one
 *          option disabled, read-only, required, invalid with its message), both variants, and a live group with a
 *          readout of the chosen keys and buttons that choose all or none, all from `@stackra/ui/react` with real
 *          props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { CheckboxGroupRoute } from "#src/routes/checkbox-group/checkbox-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::checkbox-group.*` keys.
const STRINGS = {
  documentTitle: `${CheckboxGroupRoute.title} · Stackra Playground`,
  intro:
    "A checkbox group edits one list of choices: its value is the keys of the options that are checked. It is named by its label, and its description and error message are read out with it. For a single yes or no use a checkbox.",
  basic: "A group",
  basicNote: "A label, a description under it, and a description under one of the options.",
  states: "States",
  statesNote: "One group per state, each with the caption of the state it shows.",
  captions: {
    disabled: "Disabled",
    optionDisabled: "One option disabled",
    readOnly: "Read-only",
    required: "Required",
    invalid: "Invalid, with a message",
  },
  groupLabels: {
    basic: "Notify me by",
    disabled: "Weekly reports",
    optionDisabled: "Export formats",
    readOnly: "Included in your plan",
    required: "Topics",
    invalid: "Delivery days",
    live: "Toppings",
    primary: "Primary group",
    secondary: "Secondary group",
  },
  basicDescription: "You can change this at any time.",
  invalidDescription: "Pick at least one day.",
  invalidError: "Choose a delivery day to continue.",
  variants: "Variants",
  variantsNote:
    "The primary variant sits on the page; the secondary variant is for a group on a surface.",
  live: "Try it",
  liveNote: "The readout lists the keys of the checked options, in the order they were checked.",
  chosen: (keys: string) => `Chosen: ${keys}`,
  none: "none",
  all: "Choose all",
  clear: "Clear",
} as const;

/** The channels of the first group; the email option carries a description. */
const CHANNELS: readonly ChoiceOption[] = [
  { value: "email", label: "Email", description: "A weekly digest." },
  { value: "sms", label: "Text message" },
  { value: "push", label: "Push notification" },
];

/** The options of the state samples. */
const FORMATS: readonly ChoiceOption[] = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF" },
];

/** The options with one of them disabled. */
const FORMATS_WITH_ONE_DISABLED: readonly ChoiceOption[] = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel" },
  { value: "pdf", label: "PDF", isDisabled: true },
];

/** The options of the live example. */
const TOPPINGS: readonly ChoiceOption[] = [
  { value: "cheese", label: "Cheese" },
  { value: "olives", label: "Olives" },
  { value: "basil", label: "Basil" },
  { value: "chilli", label: "Chilli" },
];

/** The days of the invalid sample. */
const DAYS: readonly ChoiceOption[] = [
  { value: "mon", label: "Monday" },
  { value: "thu", label: "Thursday" },
];

/** The list that lays samples out in a responsive grid. */
const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Ui.Text tone="muted" type="small">
        {caption}
      </Ui.Text>
      {children}
    </li>
  );
}

/** The CheckboxGroup page. */
export function CheckboxGroup() {
  const [days, setDays] = useState<readonly string[]>([]);
  const [toppings, setToppings] = useState<readonly string[]>(["cheese"]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{CheckboxGroupRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="checkbox-group-basic" title={STRINGS.basic} note={STRINGS.basicNote}>
        <Ui.CheckboxGroup
          label={STRINGS.groupLabels.basic}
          description={STRINGS.basicDescription}
          options={CHANNELS}
          defaultValue={["email"]}
        />
      </PageSection>

      <PageSection id="checkbox-group-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className={GRID}>
          <Sample caption={STRINGS.captions.disabled}>
            <Ui.CheckboxGroup
              label={STRINGS.groupLabels.disabled}
              options={FORMATS}
              defaultValue={["csv"]}
              isDisabled
            />
          </Sample>
          <Sample caption={STRINGS.captions.optionDisabled}>
            <Ui.CheckboxGroup
              label={STRINGS.groupLabels.optionDisabled}
              options={FORMATS_WITH_ONE_DISABLED}
            />
          </Sample>
          <Sample caption={STRINGS.captions.readOnly}>
            <Ui.CheckboxGroup
              label={STRINGS.groupLabels.readOnly}
              options={FORMATS}
              defaultValue={["csv", "pdf"]}
              isReadOnly
            />
          </Sample>
          <Sample caption={STRINGS.captions.required}>
            <Ui.CheckboxGroup label={STRINGS.groupLabels.required} options={FORMATS} isRequired />
          </Sample>
          <Sample caption={STRINGS.captions.invalid}>
            <Ui.CheckboxGroup
              label={STRINGS.groupLabels.invalid}
              description={STRINGS.invalidDescription}
              errorMessage={STRINGS.invalidError}
              options={DAYS}
              value={days}
              onChange={setDays}
              isInvalid={days.length === 0}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection
        id="checkbox-group-variants"
        title={STRINGS.variants}
        note={STRINGS.variantsNote}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Ui.CheckboxGroup
            label={STRINGS.groupLabels.primary}
            options={FORMATS}
            defaultValue={["xlsx"]}
            variant="primary"
          />
          <Ui.Surface variant="default" className="rounded-2xl p-4">
            <Ui.CheckboxGroup
              label={STRINGS.groupLabels.secondary}
              options={FORMATS}
              defaultValue={["xlsx"]}
              variant="secondary"
            />
          </Ui.Surface>
        </div>
      </PageSection>

      <PageSection id="checkbox-group-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <Ui.CheckboxGroup
            label={STRINGS.groupLabels.live}
            options={TOPPINGS}
            value={toppings}
            onChange={setToppings}
          />
          <Ui.Text role="status">{STRINGS.chosen(toppings.join(", ") || STRINGS.none)}</Ui.Text>
          <div className="flex flex-wrap gap-3">
            <Ui.Button
              variant="secondary"
              onPress={() => setToppings(TOPPINGS.map(({ value }) => value))}
            >
              {STRINGS.all}
            </Ui.Button>
            <Ui.Button variant="secondary" onPress={() => setToppings([])}>
              {STRINGS.clear}
            </Ui.Button>
          </div>
        </div>
      </PageSection>
    </article>
  );
}
