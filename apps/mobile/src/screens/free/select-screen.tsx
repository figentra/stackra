/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Select` (@stackra/ui): a labelled and a described field, items
 *          with a second line and a refused one, each state, full width, the bottom-sheet presentation, and a live
 *          field whose key is reported and cleared from outside.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { Button, Select, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A visible label with a placeholder, and a label with a description.",
    status: "Order status",
    statusPlaceholder: "Choose a status",
    method: "Shipping method",
    methodPlaceholder: "Choose a method",
    hint: "How the order leaves the warehouse.",
  },
  items: {
    title: "Items",
    description:
      "Each choice can carry a second line, and a choice can be shown but refused: Legacy is disabled.",
    label: "Plan",
    placeholder: "Choose a plan",
  },
  states: {
    title: "States",
    description:
      "Each state of the field. Disabled and read-only keep their value; read-only never opens.",
    withValue: "With a value",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Choose a status before you continue.",
    disabled: "Disabled",
    readOnly: "Read-only",
  },
  presentation: {
    title: "Full width and sheet",
    description:
      '`isFullWidth` fills the parent; `presentation="bottom-sheet"` opens the list as a sheet.',
    fullWidth: "Full width",
    sheet: "In a bottom sheet",
  },
  live: {
    title: "Try it",
    description:
      "Choose a status and the page reports its key; Clear sets the value to null from outside.",
    label: "Status of the shipment",
    chosen: (key: string | null) => `Chosen key: ${key ?? "none"}`,
    clear: "Clear the choice",
  },
} as const;

/** The order statuses; Void is refused. */
const STATUSES: readonly SelectItem[] = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void", isDisabled: true },
];

/** The shipping methods of the described sample. */
const METHODS: readonly SelectItem[] = [
  { id: "post", label: "Post" },
  { id: "courier", label: "Courier" },
  { id: "pickup", label: "Pickup" },
];

/** The plans of the sample whose choices carry a second line. */
const PLANS: readonly SelectItem[] = [
  { id: "free", label: "Free", description: "For one person, up to three projects." },
  { id: "team", label: "Team", description: "For a group, with shared projects." },
  { id: "scale", label: "Scale", description: "For a company, with audit and support." },
  { id: "legacy", label: "Legacy", description: "No longer sold.", isDisabled: true },
];

/** The Select page: one section per option, in a scrollable screen. */
export function SelectScreen() {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Select
          label={STRINGS.basics.status}
          placeholder={STRINGS.basics.statusPlaceholder}
          items={STATUSES}
        />
        <Select
          label={STRINGS.basics.method}
          description={STRINGS.basics.hint}
          placeholder={STRINGS.basics.methodPlaceholder}
          items={METHODS}
        />
      </Section>

      <Section title={STRINGS.items.title} description={STRINGS.items.description}>
        <Select label={STRINGS.items.label} placeholder={STRINGS.items.placeholder} items={PLANS} />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <Select label={STRINGS.states.withValue} items={STATUSES} defaultValue="sent" />
        <Select label={STRINGS.states.required} items={STATUSES} isRequired />
        <Select
          label={STRINGS.states.invalid}
          items={STATUSES}
          isInvalid
          errorMessage={STRINGS.states.invalidError}
        />
        <Select label={STRINGS.states.disabled} items={STATUSES} isDisabled defaultValue="paid" />
        <Select label={STRINGS.states.readOnly} items={STATUSES} isReadOnly defaultValue="paid" />
      </Section>

      <Section title={STRINGS.presentation.title} description={STRINGS.presentation.description}>
        <Select label={STRINGS.presentation.fullWidth} items={METHODS} isFullWidth />
        <Select label={STRINGS.presentation.sheet} items={PLANS} presentation="bottom-sheet" />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Select label={STRINGS.live.label} items={STATUSES} value={chosen} onChange={setChosen} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.chosen(chosen)}
        </Text>
        <Button size="sm" variant="tertiary" onPress={() => setChosen(null)}>
          {STRINGS.live.clear}
        </Button>
      </Section>
    </Screen>
  );
}
