/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ComboBox` (@stackra/ui): a labelled and a described field, one and several choices, items with a second line and a refused one, each state, full
 *          width, and a live field searched and paged by a pretend server.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { ComboBox, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A visible label with a placeholder, and a label with a description.",
    country: "Country",
    placeholder: "Type a country",
    described: "Ship from",
    hint: "The warehouse the order leaves from.",
  },
  modes: {
    title: "One or several",
    description:
      'One choice fills the field with its label. With `selectionMode="multiple"` the sheet stays open while choices toggle.',
    single: "One country",
    multiple: "Several countries",
  },
  items: {
    title: "Items",
    description:
      "Each choice can carry a second line, and a choice can be shown but refused: Lisbon is disabled.",
    label: "Office",
    placeholder: "Type a city",
  },
  states: {
    title: "States",
    description:
      "Each state of the field. Disabled and read-only keep their value; the empty one says so when nothing matches.",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Choose a country before you continue.",
    disabled: "Disabled",
    readOnly: "Read-only",
    noMatch: "With a no-match message",
    noMatchMessage: "No country found.",
  },
  fullWidth: {
    title: "Full width",
    description: "`isFullWidth` fills the width of the parent.",
    label: "Full width",
  },
  live: {
    title: "Try it",
    description:
      "Type to search a list held by a pretend server: the list is busy while it answers, and scrolling to its end loads the next page.",
    label: "Find a country",
    loading: "Loading countries",
    chosen: (key: string | null) => `Chosen key: ${key ?? "none"}`,
    shown: (shown: number, total: number) => `Showing ${shown} of ${total} countries.`,
  },
} as const;

/** The countries every sample lists; Andorra is refused. */
const COUNTRIES: readonly SelectItem[] = [
  { id: "ar", label: "Argentina" },
  { id: "ad", label: "Andorra", isDisabled: true },
  { id: "au", label: "Australia" },
  { id: "at", label: "Austria" },
  { id: "be", label: "Belgium" },
  { id: "br", label: "Brazil" },
  { id: "ca", label: "Canada" },
  { id: "cl", label: "Chile" },
  { id: "cz", label: "Czechia" },
  { id: "dk", label: "Denmark" },
  { id: "eg", label: "Egypt" },
  { id: "fi", label: "Finland" },
  { id: "fr", label: "France" },
  { id: "de", label: "Germany" },
  { id: "gr", label: "Greece" },
  { id: "in", label: "India" },
  { id: "it", label: "Italy" },
  { id: "jp", label: "Japan" },
  { id: "ke", label: "Kenya" },
  { id: "mx", label: "Mexico" },
  { id: "nl", label: "Netherlands" },
  { id: "no", label: "Norway" },
  { id: "es", label: "Spain" },
  { id: "se", label: "Sweden" },
];

/** The offices of the sample whose choices carry a second line. */
const OFFICES: readonly SelectItem[] = [
  { id: "cai", label: "Cairo", description: "Engineering and support" },
  { id: "ber", label: "Berlin", description: "Sales for Europe" },
  { id: "ldn", label: "London", description: "Head office" },
  { id: "nyc", label: "New York", description: "Sales for the Americas" },
  { id: "lis", label: "Lisbon", description: "Closed in 2024", isDisabled: true },
];

/** How many countries the pretend server returns per page, and how long it takes to answer, in milliseconds. */
const PAGE_SIZE = 8;
const SERVER_DELAY = 400;

/** The live field: the app filters and pages the list itself, so the field filters nothing (`isServerFiltered`). */
function LiveComboBox() {
  const [text, setText] = useState("");
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const matches = COUNTRIES.filter((country) =>
    country.label.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase()),
  );
  const shown = isLoading ? [] : matches.slice(0, pages * PAGE_SIZE);

  // A pretend round trip for each new search or page; the timer is cleared when another one starts.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a demo of a busy state: the effect starts a pretend request and marks it busy
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), SERVER_DELAY);
    return () => clearTimeout(timer);
  }, [text, pages]);

  return (
    <>
      <ComboBox
        label={STRINGS.live.label}
        items={shown}
        inputValue={text}
        onInputChange={(next) => {
          setText(next);
          setPages(1);
        }}
        isServerFiltered
        isLoading={isLoading}
        loadingLabel={STRINGS.live.loading}
        onLoadMore={() => {
          if (!isLoading && shown.length < matches.length) setPages((page) => page + 1);
        }}
        emptyMessage={STRINGS.states.noMatchMessage}
        value={chosen}
        onChange={setChosen}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.live.chosen(chosen)}
      </Text>
      <Text tone="muted">{STRINGS.live.shown(shown.length, matches.length)}</Text>
    </>
  );
}

/** The ComboBox page: one section per mode and state, in a scrollable screen. */
export function ComboBoxScreen() {
  const [several, setSeveral] = useState<readonly string[]>(["eg", "fr"]);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <ComboBox
          label={STRINGS.basics.country}
          placeholder={STRINGS.basics.placeholder}
          items={COUNTRIES}
        />
        <ComboBox
          label={STRINGS.basics.described}
          description={STRINGS.basics.hint}
          placeholder={STRINGS.basics.placeholder}
          items={COUNTRIES}
        />
      </Section>

      <Section title={STRINGS.modes.title} description={STRINGS.modes.description}>
        <ComboBox label={STRINGS.modes.single} items={COUNTRIES} defaultValue="eg" />
        <ComboBox
          label={STRINGS.modes.multiple}
          items={COUNTRIES}
          selectionMode="multiple"
          value={several}
          onChange={setSeveral}
        />
      </Section>

      <Section title={STRINGS.items.title} description={STRINGS.items.description}>
        <ComboBox
          label={STRINGS.items.label}
          placeholder={STRINGS.items.placeholder}
          items={OFFICES}
        />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <ComboBox label={STRINGS.states.required} items={COUNTRIES} isRequired />
        <ComboBox
          label={STRINGS.states.invalid}
          items={COUNTRIES}
          isInvalid
          errorMessage={STRINGS.states.invalidError}
        />
        <ComboBox label={STRINGS.states.disabled} items={COUNTRIES} isDisabled defaultValue="fr" />
        <ComboBox label={STRINGS.states.readOnly} items={COUNTRIES} isReadOnly defaultValue="fr" />
        <ComboBox
          label={STRINGS.states.noMatch}
          items={COUNTRIES}
          emptyMessage={STRINGS.states.noMatchMessage}
        />
      </Section>

      <Section title={STRINGS.fullWidth.title} description={STRINGS.fullWidth.description}>
        <ComboBox label={STRINGS.fullWidth.label} items={COUNTRIES} isFullWidth />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveComboBox />
      </Section>
    </Screen>
  );
}
