/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ComboBox` (@stackra-pro/ui): a text input that filters a
 *          popover list, with a clear button, a multiple selection shown below the input, the menu opening only while
 *          typing or only from the chevron, grouped items, and the invalid and disabled states.
 * Boundary: presentation and local demo state only; the field is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Description, FieldError, Label, Text } from "@stackra/ui/native";
import { ComboBox, type ComboBoxProps } from "@stackra-pro/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  single: {
    title: "Single selection",
    description:
      "Typing filters the list; picking an item writes its label into the input, and clearing the input clears the pick.",
    label: "Favourite animal",
    placeholder: "Search animals...",
    selected: "Selected:",
    none: "nothing yet",
  },
  multiple: {
    title: "Multiple selection",
    description:
      '`selectionMode="multiple"` keeps the list open while items toggle; `ComboBox.Value` shows the picks.',
    label: "Favourite animals",
    placeholder: "Search animals...",
  },
  menu: {
    title: "Menu trigger",
    description:
      '`menuTrigger="input"` opens the list only while typing; `"manual"` opens it only from the chevron.',
    typing: "Opens while typing",
    manual: "Opens from the chevron",
    placeholder: "Search animals...",
  },
  sections: {
    title: "Sections",
    description: "`ListLabel` groups the items; `textValue` lets a keyword match.",
    label: "Pet or wild animal",
    pets: "Pets",
    wild: "Wild animals",
  },
  invalid: {
    title: "Invalid",
    description: "`isInvalid` gives the input the danger border and shows the message.",
    label: "Spirit animal",
    hint: "Pick the one you feel closest to.",
    error: "Please select an animal.",
    placeholder: "Search animals...",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off the input and the chevron.",
    label: "Locked animal",
  },
  empty: "No matching animals.",
  clear: "Clear the selection",
} as const;

/** The demo options: a value for the form and a label for the person. */
const ANIMALS = [
  { value: "cat", label: "Cat" },
  { value: "dog", label: "Dog" },
  { value: "bird", label: "Bird" },
  { value: "fox", label: "Fox" },
  { value: "owl", label: "Owl" },
] as const;

/** The items of the demo list, as one fragment so each field lists the same animals. */
function AnimalItems() {
  return (
    <>
      {ANIMALS.map((animal) => (
        <ComboBox.Item key={animal.value} value={animal.value} label={animal.label} />
      ))}
    </>
  );
}

/** The popover that every field below shares: the animal list and the empty message. */
function AnimalPortal() {
  return (
    <ComboBox.Portal>
      <ComboBox.Overlay />
      <ComboBox.Content>
        <ComboBox.List>
          <AnimalItems />
        </ComboBox.List>
        <ComboBox.Empty>{STRINGS.empty}</ComboBox.Empty>
      </ComboBox.Content>
    </ComboBox.Portal>
  );
}

/** The input row: the text input with the clear button and the chevron in its suffix. */
function AnimalInput({ placeholder, label }: { placeholder: string; label: string }) {
  return (
    <ComboBox.Trigger>
      <ComboBox.InputGroup>
        <ComboBox.Input placeholder={placeholder} accessibilityLabel={label} />
        <ComboBox.Suffix>
          <ComboBox.ClearButton accessibilityLabel={STRINGS.clear} />
          <ComboBox.TriggerIndicator />
        </ComboBox.Suffix>
      </ComboBox.InputGroup>
    </ComboBox.Trigger>
  );
}

/** The ComboBox page: one section per mode and state, in a scrollable screen. */
export function ComboBoxScreen() {
  const [single, setSingle] = useState<ComboBoxProps["value"]>(undefined);
  const [multiple, setMultiple] = useState<NonNullable<ComboBoxProps<"multiple">["value"]>>([]);

  return (
    <Screen>
      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <ComboBox label={STRINGS.single.label} value={single} onValueChange={setSingle}>
          <Label>{STRINGS.single.label}</Label>
          <AnimalInput placeholder={STRINGS.single.placeholder} label={STRINGS.single.label} />
          <AnimalPortal />
        </ComboBox>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.single.selected} ${single && !Array.isArray(single) ? single.label : STRINGS.single.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.multiple.title} description={STRINGS.multiple.description}>
        <ComboBox
          label={STRINGS.multiple.label}
          selectionMode="multiple"
          value={multiple}
          onValueChange={setMultiple}
        >
          <Label>{STRINGS.multiple.label}</Label>
          <AnimalInput placeholder={STRINGS.multiple.placeholder} label={STRINGS.multiple.label} />
          <ComboBox.Value />
          <AnimalPortal />
        </ComboBox>
      </Section>

      <Section title={STRINGS.menu.title} description={STRINGS.menu.description}>
        <ComboBox label={STRINGS.menu.typing} menuTrigger="input">
          <Label>{STRINGS.menu.typing}</Label>
          <AnimalInput placeholder={STRINGS.menu.placeholder} label={STRINGS.menu.typing} />
          <AnimalPortal />
        </ComboBox>
        <ComboBox label={STRINGS.menu.manual} menuTrigger="manual">
          <Label>{STRINGS.menu.manual}</Label>
          <AnimalInput placeholder={STRINGS.menu.placeholder} label={STRINGS.menu.manual} />
          <AnimalPortal />
        </ComboBox>
      </Section>

      <Section title={STRINGS.sections.title} description={STRINGS.sections.description}>
        <ComboBox label={STRINGS.sections.label}>
          <Label>{STRINGS.sections.label}</Label>
          <AnimalInput placeholder={STRINGS.single.placeholder} label={STRINGS.sections.label} />
          <ComboBox.Portal>
            <ComboBox.Overlay />
            <ComboBox.Content>
              <ComboBox.List>
                <ComboBox.ListLabel>{STRINGS.sections.pets}</ComboBox.ListLabel>
                <ComboBox.Item value="cat" label="Cat" textValue="Cat kitten feline" />
                <ComboBox.Item value="dog" label="Dog" textValue="Dog puppy canine" />
                <ComboBox.ListLabel>{STRINGS.sections.wild}</ComboBox.ListLabel>
                <ComboBox.Item value="fox" label="Fox" />
                <ComboBox.Item value="owl" label="Owl" />
              </ComboBox.List>
              <ComboBox.Empty>{STRINGS.empty}</ComboBox.Empty>
            </ComboBox.Content>
          </ComboBox.Portal>
        </ComboBox>
      </Section>

      <Section title={STRINGS.invalid.title} description={STRINGS.invalid.description}>
        <ComboBox label={STRINGS.invalid.label} isInvalid>
          <Label>{STRINGS.invalid.label}</Label>
          <AnimalInput placeholder={STRINGS.invalid.placeholder} label={STRINGS.invalid.label} />
          <AnimalPortal />
          <Description hideOnInvalid>{STRINGS.invalid.hint}</Description>
          <FieldError>{STRINGS.invalid.error}</FieldError>
        </ComboBox>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <ComboBox label={STRINGS.disabled.label} isDisabled defaultValue={ANIMALS[0]}>
          <Label>{STRINGS.disabled.label}</Label>
          <AnimalInput placeholder={STRINGS.single.placeholder} label={STRINGS.disabled.label} />
          <AnimalPortal />
        </ComboBox>
      </Section>
    </Screen>
  );
}
