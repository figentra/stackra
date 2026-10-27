/**
 * Stackra file contract:
 * Purpose: the page of the combo box route: the field with a label, with a description and with only an accessible name,
 *          one choice and several (the picked ones as removable tags), items with descriptions and a disabled item, every
 *          state (required, invalid, disabled, read-only, full width, no match) and a live example that searches a list
 *          "on a server", shows a busy list while it does, loads more as the list is scrolled and reports the chosen key,
 *          all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The server is a timer over a
 *          list, so the loading state can be seen and tested.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { ComboBox as UiComboBox, Heading, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { ComboBoxRoute } from "#src/routes/combo-box/combo-box.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::combo-box.*` keys.
const STRINGS = {
  documentTitle: `${ComboBoxRoute.title} · Stackra Playground`,
  intro:
    "A combo box picks from a list that narrows as you type: one choice, or several shown as removable tags. The list can be searched and paged by a server. For a short fixed list use a select.",
  basics: "Basics",
  basicsNote:
    "A visible label with a placeholder, a label with a description, and a field with no visible label that is named for assistive technology.",
  countryLabel: "Country",
  countryPlaceholder: "Type a country",
  describedLabel: "Ship from",
  describedPlaceholder: "Type a country",
  description: "The warehouse the order leaves from.",
  hiddenLabelName: "Search countries",
  modes: "One or several",
  modesNote:
    "One choice fills the field with its text. In multiple mode the field stays for typing and the picked choices show as tags you can remove.",
  single: "One country",
  multiple: "Several countries",
  items: "Items",
  itemsNote:
    "Each choice can carry a second line, and a choice can be shown but refused: Andorra is disabled.",
  richLabel: "Office",
  richPlaceholder: "Type a city",
  states: "States",
  statesNote:
    "Each state of the field. Disabled and read-only keep their value; the empty one says so when nothing matches.",
  required: "Required",
  invalid: "Invalid",
  invalidError: "Choose a country before you continue.",
  disabled: "Disabled",
  readOnly: "Read-only",
  noMatch: "With a no-match message",
  noMatchMessage: "No country found.",
  fullWidth: "Full width",
  fullWidthNote: "The field fills the width of its parent.",
  live: "Try it",
  liveNote:
    "Type to search a list held by a pretend server: the list is busy while it answers, and scrolling to its end loads the next page.",
  liveLabel: "Find a country",
  liveLoading: "Loading countries",
  chosen: (key: string | null) => `Chosen key: ${key ?? "none"}`,
  shown: (shown: number, total: number) => `Showing ${shown} of ${total} countries.`,
} as const;

/** The countries of the samples, and of the pretend server. */
const COUNTRIES = [
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
] as const;

/** The offices of the sample whose choices carry a second line. */
const OFFICES = [
  { id: "cai", label: "Cairo", description: "Engineering and support" },
  { id: "ber", label: "Berlin", description: "Sales for Europe" },
  { id: "ldn", label: "London", description: "Head office" },
  { id: "nyc", label: "New York", description: "Sales for the Americas" },
  { id: "old", label: "Lisbon", description: "Closed in 2024", isDisabled: true },
] as const;

/** How many countries the pretend server returns per page, and how long it takes to answer, in milliseconds. */
const PAGE_SIZE = 8;
const SERVER_DELAY = 400;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** The ComboBox page. */
export function ComboBox() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [applied, setApplied] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // The pretend server: it answers after a moment, with the matches so far, a page at a time.
  const matches = COUNTRIES.filter((country) =>
    country.label.toLowerCase().includes(applied.toLowerCase()),
  );
  const answer = (then: () => void) => {
    setIsLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      then();
      setIsLoading(false);
    }, SERVER_DELAY);
  };
  const search = (text: string) =>
    answer(() => {
      setApplied(text);
      setLimit(PAGE_SIZE);
    });
  const loadMore = () => {
    if (isLoading || limit >= matches.length) return;
    answer(() => setLimit((current) => current + PAGE_SIZE));
  };
  const page = matches.slice(0, limit);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{ComboBoxRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="combo-box-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={ROW}>
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.countryLabel}
            placeholder={STRINGS.countryPlaceholder}
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.describedLabel}
            placeholder={STRINGS.describedPlaceholder}
            description={STRINGS.description}
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            aria-label={STRINGS.hiddenLabelName}
            placeholder={STRINGS.hiddenLabelName}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="combo-box-modes" title={STRINGS.modes} note={STRINGS.modesNote}>
        <div className={ROW}>
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.single}
            placeholder={STRINGS.countryPlaceholder}
            defaultValue="au"
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.multiple}
            placeholder={STRINGS.countryPlaceholder}
            selectionMode="multiple"
            defaultValue={["ar", "au", "eg"]}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="combo-box-items" title={STRINGS.items} note={STRINGS.itemsNote}>
        <div className={ROW}>
          <UiComboBox
            items={OFFICES}
            label={STRINGS.richLabel}
            placeholder={STRINGS.richPlaceholder}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="combo-box-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.required}
            placeholder={STRINGS.countryPlaceholder}
            isRequired
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.invalid}
            placeholder={STRINGS.countryPlaceholder}
            isInvalid
            errorMessage={STRINGS.invalidError}
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.disabled}
            defaultValue="au"
            isDisabled
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.readOnly}
            defaultValue="au"
            isReadOnly
            className={SAMPLE}
          />
          <UiComboBox
            items={COUNTRIES}
            label={STRINGS.noMatch}
            placeholder={STRINGS.countryPlaceholder}
            emptyMessage={STRINGS.noMatchMessage}
            className={SAMPLE}
          />
        </div>
        <UiComboBox
          items={COUNTRIES}
          label={STRINGS.fullWidth}
          description={STRINGS.fullWidthNote}
          placeholder={STRINGS.countryPlaceholder}
          isFullWidth
        />
      </PageSection>

      <PageSection id="combo-box-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiComboBox
          items={page}
          label={STRINGS.liveLabel}
          placeholder={STRINGS.countryPlaceholder}
          isServerFiltered
          isLoading={isLoading}
          loadingLabel={STRINGS.liveLoading}
          onInputChange={search}
          onLoadMore={loadMore}
          emptyMessage={STRINGS.noMatchMessage}
          value={chosen}
          onChange={setChosen}
          className={SAMPLE}
        />
        <Text role="status" data-testid="combo-box-chosen" tone="muted">
          {STRINGS.chosen(chosen)}
        </Text>
        <Text data-testid="combo-box-shown" tone="muted">
          {STRINGS.shown(page.length, matches.length)}
        </Text>
      </PageSection>
    </article>
  );
}
