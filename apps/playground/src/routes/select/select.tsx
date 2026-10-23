/**
 * Stackra file contract:
 * Purpose: the page of the select route: the field with a label, with a description and with only an accessible name,
 *          a placeholder, items with descriptions and a disabled item, every state (value, required, invalid, disabled,
 *          read-only, full width) and a live example whose chosen key is reported and can be cleared from outside, all
 *          from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { SelectRoute } from "#src/routes/select/select.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::select.*` keys.
const STRINGS = {
  documentTitle: `${SelectRoute.title} · Stackra Playground`,
  intro:
    "A select picks one choice from a short list. The value is the choice's key, or null for nothing. For a long list, or one the user searches, use a combo box.",
  basics: "Basics",
  basicsNote:
    "A visible label, a label with a description and a placeholder, and a field with no visible label that is named for assistive technology.",
  statusLabel: "Order status",
  statusPlaceholder: "Choose a status",
  describedLabel: "Shipping method",
  describedPlaceholder: "Choose a method",
  description: "How the order leaves the warehouse.",
  hiddenLabelName: "Sort orders by",
  items: "Items",
  itemsNote:
    "Each choice can carry a second line, and a choice can be shown but refused: Void is disabled.",
  richLabel: "Plan",
  richPlaceholder: "Choose a plan",
  states: "States",
  statesNote:
    "Each state of the field. Disabled and read-only keep their value; read-only keeps focus and never opens.",
  withValue: "With a value",
  required: "Required",
  invalid: "Invalid",
  invalidError: "Choose a status before you continue.",
  disabled: "Disabled",
  readOnly: "Read-only",
  fullWidth: "Full width",
  fullWidthNote: "The field fills the width of its parent.",
  live: "Try it",
  liveNote:
    "Choose a status and the page reports its key; Clear sets the value to null from outside, which empties the field.",
  liveLabel: "Status of the shipment",
  chosen: (key: string | null) => `Chosen key: ${key ?? "none"}`,
  clear: "Clear the choice",
} as const;

/** The choices of the order status samples; Void is shown but refused. */
const STATUSES = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void", isDisabled: true },
] as const;

/** The shipping methods of the described sample. */
const METHODS = [
  { id: "post", label: "Post" },
  { id: "courier", label: "Courier" },
  { id: "pickup", label: "Pickup" },
] as const;

/** The sort orders of the sample that has no visible label. */
const SORTS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
] as const;

/** The plans of the sample whose choices carry a second line. */
const PLANS = [
  { id: "free", label: "Free", description: "For one person, up to three projects." },
  { id: "team", label: "Team", description: "For a group, with shared projects." },
  { id: "scale", label: "Scale", description: "For a company, with audit and support." },
  { id: "legacy", label: "Legacy", description: "No longer sold.", isDisabled: true },
] as const;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** The Select page. */
export function Select() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{SelectRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="select-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={ROW}>
          <Ui.Select
            items={STATUSES}
            label={STRINGS.statusLabel}
            placeholder={STRINGS.statusPlaceholder}
            className={SAMPLE}
          />
          <Ui.Select
            items={METHODS}
            label={STRINGS.describedLabel}
            placeholder={STRINGS.describedPlaceholder}
            description={STRINGS.description}
            className={SAMPLE}
          />
          <Ui.Select
            items={SORTS}
            aria-label={STRINGS.hiddenLabelName}
            defaultValue="newest"
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="select-items" title={STRINGS.items} note={STRINGS.itemsNote}>
        <div className={ROW}>
          <Ui.Select
            items={PLANS}
            label={STRINGS.richLabel}
            placeholder={STRINGS.richPlaceholder}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="select-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <Ui.Select
            items={STATUSES}
            label={STRINGS.withValue}
            defaultValue="sent"
            className={SAMPLE}
          />
          <Ui.Select
            items={STATUSES}
            label={STRINGS.required}
            placeholder={STRINGS.statusPlaceholder}
            isRequired
            className={SAMPLE}
          />
          <Ui.Select
            items={STATUSES}
            label={STRINGS.invalid}
            placeholder={STRINGS.statusPlaceholder}
            isInvalid
            errorMessage={STRINGS.invalidError}
            className={SAMPLE}
          />
          <Ui.Select
            items={STATUSES}
            label={STRINGS.disabled}
            defaultValue="sent"
            isDisabled
            className={SAMPLE}
          />
          <Ui.Select
            items={STATUSES}
            label={STRINGS.readOnly}
            defaultValue="sent"
            isReadOnly
            className={SAMPLE}
          />
        </div>
        <Ui.Select
          items={STATUSES}
          label={STRINGS.fullWidth}
          description={STRINGS.fullWidthNote}
          placeholder={STRINGS.statusPlaceholder}
          isFullWidth
        />
      </PageSection>

      <PageSection id="select-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.Select
            items={STATUSES}
            label={STRINGS.liveLabel}
            placeholder={STRINGS.statusPlaceholder}
            value={status}
            onChange={setStatus}
            className={SAMPLE}
          />
          <Ui.Button variant="secondary" onPress={() => setStatus(null)}>
            {STRINGS.clear}
          </Ui.Button>
        </div>
        <Ui.Text role="status" data-testid="select-chosen" tone="muted">
          {STRINGS.chosen(status)}
        </Ui.Text>
      </PageSection>
    </article>
  );
}
