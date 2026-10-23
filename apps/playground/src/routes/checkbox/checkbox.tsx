/**
 * Stackra file contract:
 * Purpose: the page of the checkbox route: every state of a checkbox (unchecked, checked, indeterminate, disabled,
 *          read-only, required, with a description, invalid with its message), both variants, a checkbox named by
 *          `aria-label`, and a live "select all" parent over three children with a readout, all from `@stackra/ui/react`
 *          with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import * as Ui from "@stackra/ui/react";
import { useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { CheckboxRoute } from "#src/routes/checkbox/checkbox.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::checkbox.*` keys.
const STRINGS = {
  documentTitle: `${CheckboxRoute.title} · Stackra Playground`,
  intro:
    "A Checkbox is a box that is checked or not. Its label is its name, and its description and error message are read out with it. A group of related options is a checkbox group.",
  states: "States",
  statesNote: "One checkbox per state, each with the caption of the state it shows.",
  captions: {
    unchecked: "Unchecked",
    checked: "Checked",
    indeterminate: "Indeterminate",
    disabled: "Disabled",
    disabledChecked: "Disabled and checked",
    readOnly: "Read-only",
    required: "Required",
    description: "With a description",
    invalid: "Invalid, with a message",
  },
  labels: {
    unchecked: "Subscribe to the newsletter",
    checked: "Remember this device",
    indeterminate: "Select every invoice",
    disabled: "Share usage data",
    disabledChecked: "Use the company sign-in",
    readOnly: "Your plan includes backups",
    required: "I accept the terms",
    description: "Send me product updates",
    invalid: "I am over eighteen",
  },
  descriptionText: "At most one email a month.",
  errorText: "Confirm your age to continue.",
  variants: "Variants",
  variantsNote:
    "The primary variant sits on the page; the secondary variant is for a checkbox on a surface.",
  primary: "Primary variant",
  secondary: "Secondary variant",
  unnamed: "Without a visible label",
  unnamedNote:
    "A checkbox with no label takes an accessible name instead, as a table's row selector does.",
  rowSelector: "Select row 3",
  live: "Try it",
  liveNote:
    "The parent shows a dash while some children are checked, checks all of them when pressed, and clears them when all are checked.",
  parent: "Select all toppings",
  children: "Toppings",
  chosen: (names: string) => `Chosen: ${names}`,
  none: "none",
  clear: "Clear",
} as const;

/** The three children of the live example. */
const TOPPINGS = [
  { key: "cheese", label: "Cheese" },
  { key: "olives", label: "Olives" },
  { key: "basil", label: "Basil" },
] as const;

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

/** The Checkbox page. */
export function Checkbox() {
  const [topping, setTopping] = useState<readonly string[]>(["cheese"]);
  const [accepted, setAccepted] = useState(false);
  const all = topping.length === TOPPINGS.length;
  const names = TOPPINGS.filter(({ key }) => topping.includes(key))
    .map(({ label }) => label)
    .join(", ");

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{CheckboxRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="checkbox-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <ul className={GRID}>
          <Sample caption={STRINGS.captions.unchecked}>
            <Ui.Checkbox label={STRINGS.labels.unchecked} />
          </Sample>
          <Sample caption={STRINGS.captions.checked}>
            <Ui.Checkbox label={STRINGS.labels.checked} defaultValue />
          </Sample>
          <Sample caption={STRINGS.captions.indeterminate}>
            <Ui.Checkbox label={STRINGS.labels.indeterminate} isIndeterminate />
          </Sample>
          <Sample caption={STRINGS.captions.disabled}>
            <Ui.Checkbox label={STRINGS.labels.disabled} isDisabled />
          </Sample>
          <Sample caption={STRINGS.captions.disabledChecked}>
            <Ui.Checkbox label={STRINGS.labels.disabledChecked} isDisabled defaultValue />
          </Sample>
          <Sample caption={STRINGS.captions.readOnly}>
            <Ui.Checkbox label={STRINGS.labels.readOnly} isReadOnly defaultValue />
          </Sample>
          <Sample caption={STRINGS.captions.required}>
            <Ui.Checkbox label={STRINGS.labels.required} isRequired />
          </Sample>
          <Sample caption={STRINGS.captions.description}>
            <Ui.Checkbox label={STRINGS.labels.description} description={STRINGS.descriptionText} />
          </Sample>
          <Sample caption={STRINGS.captions.invalid}>
            <Ui.Checkbox
              label={STRINGS.labels.invalid}
              isInvalid={!accepted}
              errorMessage={STRINGS.errorText}
              value={accepted}
              onChange={setAccepted}
            />
          </Sample>
        </ul>
      </PageSection>

      <PageSection id="checkbox-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid content-start gap-3">
            <Ui.Text tone="muted" type="small">
              {STRINGS.primary}
            </Ui.Text>
            <Ui.Checkbox variant="primary" label="Primary, unchecked" />
            <Ui.Checkbox variant="primary" label="Primary, checked" defaultValue />
          </div>
          <Ui.Surface variant="default" className="grid content-start gap-3 rounded-2xl p-4">
            <Ui.Text tone="muted" type="small">
              {STRINGS.secondary}
            </Ui.Text>
            <Ui.Checkbox variant="secondary" label="Secondary, unchecked" />
            <Ui.Checkbox variant="secondary" label="Secondary, checked" defaultValue />
          </Ui.Surface>
        </div>
      </PageSection>

      <PageSection id="checkbox-unnamed" title={STRINGS.unnamed} note={STRINGS.unnamedNote}>
        <Ui.Checkbox aria-label={STRINGS.rowSelector} />
      </PageSection>

      <PageSection id="checkbox-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className="grid gap-3">
          <Ui.Checkbox
            label={STRINGS.parent}
            value={all}
            isIndeterminate={topping.length > 0 && !all}
            onChange={(isChecked) => setTopping(isChecked ? TOPPINGS.map(({ key }) => key) : [])}
          />
          <ul aria-label={STRINGS.children} className="grid gap-3 ps-8">
            {TOPPINGS.map(({ key, label }) => (
              <li key={key}>
                <Ui.Checkbox
                  label={label}
                  value={topping.includes(key)}
                  onChange={(isChecked) =>
                    setTopping((current) =>
                      isChecked ? [...current, key] : current.filter((item) => item !== key),
                    )
                  }
                />
              </li>
            ))}
          </ul>
          <Ui.Text role="status">{STRINGS.chosen(names || STRINGS.none)}</Ui.Text>
          <div>
            <Ui.Button variant="secondary" onPress={() => setTopping([])}>
              {STRINGS.clear}
            </Ui.Button>
          </div>
        </div>
      </PageSection>
    </article>
  );
}
