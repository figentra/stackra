/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Autocomplete` (@stackra/ui-pro): a searchable select in a
 *          popover with a clear button, a multiple selection, the bottom-sheet presentation, grouped items with an
 *          empty message, and the invalid and disabled states.
 * Boundary: presentation and local demo state only; the field is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Description, FieldError, Label, Text } from "@stackra/ui/native";
import { Autocomplete, type AutocompleteProps } from "@stackra/ui-pro/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  single: {
    title: "Search and clear",
    description: "Type to filter the list, pick one item, and use the clear button to start over.",
    label: "State",
    placeholder: "Select a state",
    search: "Search states",
    selected: "Selected:",
    none: "nothing yet",
  },
  multiple: {
    title: "Multiple selection",
    description:
      '`selectionMode="multiple"` keeps the list open and shows every pick in the trigger.',
    label: "States visited",
    placeholder: "Select states",
    count: "Picked:",
  },
  sheet: {
    title: "Bottom sheet with sections",
    description:
      "The list sits in a bottom sheet with the search focused, and `ListLabel` groups the items by coast.",
    label: "Home state",
    west: "West coast",
    east: "East coast",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the trigger the danger border and shows the message.",
    label: "Billing state",
    hint: "Where the card is registered.",
    error: "Please select a state.",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` stops the trigger from opening.",
    label: "Locked state",
  },
  empty: "No matching states.",
  clear: "Clear the selection",
} as const;

/** The demo options: a value for the form and a label for the person. */
const STATES = [
  { value: "ca", label: "California" },
  { value: "tx", label: "Texas" },
  { value: "ny", label: "New York" },
  { value: "wa", label: "Washington" },
  { value: "fl", label: "Florida" },
  { value: "or", label: "Oregon" },
] as const;

/** The items of the demo list, as one fragment so each field lists the same states. */
function StateItems() {
  return (
    <>
      {STATES.map((state) => (
        <Autocomplete.Item key={state.value} value={state.value} label={state.label} />
      ))}
    </>
  );
}

/** The popover content shared by the fields: the search field, the list and the empty message. */
function StateContent({ search }: { search: string }) {
  return (
    <Autocomplete.Content presentation="popover" width="trigger">
      <Autocomplete.SearchField accessibilityLabel={search} />
      <Autocomplete.List>
        <StateItems />
      </Autocomplete.List>
      <Autocomplete.Empty>{STRINGS.empty}</Autocomplete.Empty>
    </Autocomplete.Content>
  );
}

/** The Autocomplete page: one section per mode and state, in a scrollable screen. */
export function AutocompleteScreen() {
  const [single, setSingle] = useState<AutocompleteProps["value"]>(undefined);
  const [multiple, setMultiple] = useState<NonNullable<AutocompleteProps<"multiple">["value"]>>([]);

  return (
    <Screen>
      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <Autocomplete label={STRINGS.single.label} value={single} onValueChange={setSingle}>
          <Label>{STRINGS.single.label}</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value placeholder={STRINGS.single.placeholder} />
            <Autocomplete.ClearButton accessibilityLabel={STRINGS.clear} />
            <Autocomplete.TriggerIndicator />
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Overlay />
            <StateContent search={STRINGS.single.search} />
          </Autocomplete.Portal>
        </Autocomplete>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.single.selected} ${single && !Array.isArray(single) ? single.label : STRINGS.single.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.multiple.title} description={STRINGS.multiple.description}>
        <Autocomplete
          label={STRINGS.multiple.label}
          selectionMode="multiple"
          value={multiple}
          onValueChange={setMultiple}
        >
          <Label>{STRINGS.multiple.label}</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value placeholder={STRINGS.multiple.placeholder} />
            <Autocomplete.ClearButton accessibilityLabel={STRINGS.clear} />
            <Autocomplete.TriggerIndicator />
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Overlay />
            <StateContent search={STRINGS.single.search} />
          </Autocomplete.Portal>
        </Autocomplete>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.multiple.count} ${multiple.length}`}
        </Text>
      </Section>

      <Section title={STRINGS.sheet.title} description={STRINGS.sheet.description}>
        <Autocomplete label={STRINGS.sheet.label} presentation="bottom-sheet">
          <Label>{STRINGS.sheet.label}</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.TriggerIndicator />
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Overlay />
            <Autocomplete.Content presentation="bottom-sheet">
              <Autocomplete.SearchField accessibilityLabel={STRINGS.single.search} />
              <Autocomplete.List>
                <Autocomplete.ListLabel>{STRINGS.sheet.west}</Autocomplete.ListLabel>
                <Autocomplete.Item value="ca" label="California" />
                <Autocomplete.Item value="wa" label="Washington" />
                <Autocomplete.Item value="or" label="Oregon" />
                <Autocomplete.ListLabel>{STRINGS.sheet.east}</Autocomplete.ListLabel>
                <Autocomplete.Item value="ny" label="New York" />
                <Autocomplete.Item value="fl" label="Florida" />
              </Autocomplete.List>
              <Autocomplete.Empty>{STRINGS.empty}</Autocomplete.Empty>
            </Autocomplete.Content>
          </Autocomplete.Portal>
        </Autocomplete>
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <Autocomplete label={STRINGS.invalid.label} isInvalid>
          <Label>{STRINGS.invalid.label}</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.TriggerIndicator />
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Overlay />
            <StateContent search={STRINGS.single.search} />
          </Autocomplete.Portal>
          <Description hideOnInvalid>{STRINGS.invalid.hint}</Description>
          <FieldError>{STRINGS.invalid.error}</FieldError>
        </Autocomplete>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <Autocomplete label={STRINGS.disabled.label} isDisabled defaultValue={STATES[0]}>
          <Label>{STRINGS.disabled.label}</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.TriggerIndicator />
          </Autocomplete.Trigger>
          <Autocomplete.Portal>
            <Autocomplete.Overlay />
            <StateContent search={STRINGS.single.search} />
          </Autocomplete.Portal>
        </Autocomplete>
      </Section>
    </Screen>
  );
}
