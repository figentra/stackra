/**
 * Stackra file contract:
 * Purpose: the page of the radio-group route: a labelled vertical group with descriptions, a horizontal group, the
 *          group states (disabled, one option disabled, read-only, required, invalid with its message), both variants,
 *          and a live group with a readout of the chosen key and buttons that choose from outside, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { RadioGroupRoute } from "#src/routes/radio-group/radio-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::radio-group.*` keys.
const STRINGS = {
  documentTitle: `${RadioGroupRoute.title} · Stackra Playground`,
  intro:
    "A radio group chooses one option from a few: its value is the key of the chosen option. It is named by its label, and the arrow keys move through it. For many options use a select, and for several choices a checkbox group.",
  layouts: "Layouts",
  layoutsNote:
    "Vertical by default, with a description under an option; horizontal puts the options in a row.",
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
    vertical: "Shipping speed",
    horizontal: "Size",
    disabled: "Billing cycle",
    optionDisabled: "Payment method",
    readOnly: "Your plan",
    required: "Account type",
    invalid: "Delivery window",
    live: "Fruit",
    primary: "Primary group",
    secondary: "Secondary group",
  },
  verticalDescription: "Prices include tax.",
  invalidDescription: "Pick the time that suits you.",
  invalidError: "Choose a delivery window to continue.",
  variants: "Variants",
  variantsNote:
    "The primary variant sits on the page; the secondary variant is for a group on a surface.",
  live: "Try it",
  liveNote: "The readout shows the chosen key; the buttons choose from outside the group.",
  chosen: (key: string) => `Chosen: ${key}`,
  pickApple: "Choose apple",
  pickPear: "Choose pear",
} as const;

/** The options of the vertical group; the first carries a description. */
const SPEEDS: readonly ChoiceOption[] = [
  { value: "standard", label: "Standard", description: "Delivered in 5 to 7 days." },
  { value: "express", label: "Express", description: "Delivered in 2 to 3 days." },
  { value: "overnight", label: "Overnight" },
];

/** The options of the horizontal group. */
const SIZES: readonly ChoiceOption[] = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
];

/** The options of the state samples. */
const CYCLES: readonly ChoiceOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

/** The options with one of them disabled. */
const METHODS: readonly ChoiceOption[] = [
  { value: "card", label: "Card" },
  { value: "transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque", isDisabled: true },
];

/** The options of the live example. */
const FRUIT: readonly ChoiceOption[] = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
  { value: "plum", label: "Plum" },
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

/** The RadioGroup page. */
export function RadioGroup() {
  const [hasPicked, setHasPicked] = useState(false);
  const [fruit, setFruit] = useState("apple");

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{RadioGroupRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="radio-group-layouts" title={STRINGS.layouts} note={STRINGS.layoutsNote}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Ui.RadioGroup
            label={STRINGS.groupLabels.vertical}
            description={STRINGS.verticalDescription}
            options={SPEEDS}
            defaultValue="standard"
          />
          <Ui.RadioGroup
            label={STRINGS.groupLabels.horizontal}
            options={SIZES}
            orientation="horizontal"
            defaultValue="m"
          />
        </div>
      </PageSection>

      <PageSection id="radio-group-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className={GRID}>
          <Sample caption={STRINGS.captions.disabled}>
            <Ui.RadioGroup
              label={STRINGS.groupLabels.disabled}
              options={CYCLES}
              defaultValue="monthly"
              isDisabled
            />
          </Sample>
          <Sample caption={STRINGS.captions.optionDisabled}>
            <Ui.RadioGroup label={STRINGS.groupLabels.optionDisabled} options={METHODS} />
          </Sample>
          <Sample caption={STRINGS.captions.readOnly}>
            <Ui.RadioGroup
              label={STRINGS.groupLabels.readOnly}
              options={CYCLES}
              defaultValue="yearly"
              isReadOnly
            />
          </Sample>
          <Sample caption={STRINGS.captions.required}>
            <Ui.RadioGroup label={STRINGS.groupLabels.required} options={CYCLES} isRequired />
          </Sample>
          <Sample caption={STRINGS.captions.invalid}>
            <Ui.RadioGroup
              label={STRINGS.groupLabels.invalid}
              description={STRINGS.invalidDescription}
              errorMessage={STRINGS.invalidError}
              options={CYCLES}
              onChange={() => setHasPicked(true)}
              isInvalid={!hasPicked}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="radio-group-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Ui.RadioGroup
            label={STRINGS.groupLabels.primary}
            options={SIZES}
            defaultValue="s"
            variant="primary"
          />
          <Ui.Surface variant="default" className="rounded-2xl p-4">
            <Ui.RadioGroup
              label={STRINGS.groupLabels.secondary}
              options={SIZES}
              defaultValue="s"
              variant="secondary"
            />
          </Ui.Surface>
        </div>
      </PageSection>

      <PageSection id="radio-group-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <Ui.RadioGroup
            label={STRINGS.groupLabels.live}
            options={FRUIT}
            value={fruit}
            onChange={setFruit}
          />
          <Ui.Text role="status">{STRINGS.chosen(fruit)}</Ui.Text>
          <div className="flex flex-wrap gap-3">
            <Ui.Button variant="secondary" onPress={() => setFruit("apple")}>
              {STRINGS.pickApple}
            </Ui.Button>
            <Ui.Button variant="secondary" onPress={() => setFruit("pear")}>
              {STRINGS.pickPear}
            </Ui.Button>
          </div>
        </div>
      </PageSection>
    </article>
  );
}
