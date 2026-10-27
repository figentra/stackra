/**
 * Stackra file contract:
 * Purpose: the page of the search field route: the field with a label, with a description and with only an accessible
 *          name, both surfaces, full width, every state (value, required, invalid, disabled, read-only, loading) and a
 *          live example that filters a list as you type, shows a busy field while it "searches", and reports Enter and
 *          the clear button, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The search is simulated by a
 *          timer, so the loading state can be seen and tested.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { Heading, SearchField as UiSearchField, Text } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { SearchFieldRoute } from "#src/routes/search-field/search-field.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::search-field.*` keys.
const STRINGS = {
  documentTitle: `${SearchFieldRoute.title} · Stackra Playground`,
  intro:
    "A search field is a text input for finding things: a search icon, a clear button that appears once there is text, and the shared field parts (label, description, error message). It never searches by itself; the page decides when to.",
  basics: "Basics",
  basicsNote:
    "A visible label, a label with a description, and a field with no visible label that is named for assistive technology.",
  label: "Search products",
  placeholder: "Name or SKU",
  describedLabel: "Search orders",
  describedPlaceholder: "Order number",
  description: "Search by order number, customer or date.",
  hiddenLabelName: "Search the help centre",
  hiddenLabelPlaceholder: "Search the help centre",
  surfaces: "Surfaces",
  surfacesNote:
    "Primary is the field colour. Secondary is the tinted surface, for a field that sits on a card or panel.",
  primary: "Primary",
  secondary: "Secondary",
  fullWidth: "Full width",
  fullWidthNote: "The field fills the width of its parent.",
  states: "States",
  statesNote:
    "Each state of the field, with a value where the clear button matters. Disabled and read-only keep their text.",
  withValue: "With a value",
  required: "Required",
  invalid: "Invalid",
  invalidError: "Enter at least three characters.",
  disabled: "Disabled",
  readOnly: "Read-only",
  loading: "Loading",
  sampleText: "Blue shirt",
  live: "Try it",
  liveNote:
    "Type to filter the products; the field is busy while it searches. Enter submits the text and the clear button empties it.",
  liveLabel: "Find a product",
  livePlaceholder: "Try shirt, mug or lamp",
  liveClear: "Clear the product search",
  results: "Products",
  count: (total: number) => (total === 1 ? "1 product found." : `${total} products found.`),
  submitted: (text: string) => `Submitted: ${text}`,
  cleared: "Cleared the search.",
  none: "Nothing yet.",
} as const;

/** The products the live example filters. */
const PRODUCTS = [
  "Blue shirt",
  "Black shirt",
  "Ceramic mug",
  "Travel mug",
  "Desk lamp",
  "Floor lamp",
  "Canvas bag",
  "Steel bottle",
] as const;

/** How long the simulated search takes, in milliseconds. */
const SEARCH_DELAY = 400;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** The SearchField page. */
export function SearchField() {
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string>(STRINGS.none);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (next: string) => {
    setQuery(next);
    setIsSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setApplied(next);
      setIsSearching(false);
    }, SEARCH_DELAY);
  };
  const results = PRODUCTS.filter((name) => name.toLowerCase().includes(applied.toLowerCase()));

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{SearchFieldRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="search-field-basics" title={STRINGS.basics} note={STRINGS.basicsNote}>
        <div className={ROW}>
          <UiSearchField
            label={STRINGS.label}
            placeholder={STRINGS.placeholder}
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.describedLabel}
            placeholder={STRINGS.describedPlaceholder}
            description={STRINGS.description}
            className={SAMPLE}
          />
          <UiSearchField
            aria-label={STRINGS.hiddenLabelName}
            placeholder={STRINGS.hiddenLabelPlaceholder}
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="search-field-surfaces" title={STRINGS.surfaces} note={STRINGS.surfacesNote}>
        <div className={ROW}>
          <UiSearchField
            label={STRINGS.primary}
            placeholder={STRINGS.placeholder}
            variant="primary"
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.secondary}
            placeholder={STRINGS.placeholder}
            variant="secondary"
            className={SAMPLE}
          />
        </div>
        <UiSearchField
          label={STRINGS.fullWidth}
          description={STRINGS.fullWidthNote}
          placeholder={STRINGS.placeholder}
          isFullWidth
        />
      </PageSection>

      <PageSection id="search-field-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <UiSearchField
            label={STRINGS.withValue}
            defaultValue={STRINGS.sampleText}
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.required}
            placeholder={STRINGS.placeholder}
            isRequired
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.invalid}
            defaultValue="ab"
            isInvalid
            errorMessage={STRINGS.invalidError}
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.disabled}
            defaultValue={STRINGS.sampleText}
            isDisabled
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.readOnly}
            defaultValue={STRINGS.sampleText}
            isReadOnly
            className={SAMPLE}
          />
          <UiSearchField
            label={STRINGS.loading}
            defaultValue={STRINGS.sampleText}
            isLoading
            className={SAMPLE}
          />
        </div>
      </PageSection>

      <PageSection id="search-field-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiSearchField
          label={STRINGS.liveLabel}
          placeholder={STRINGS.livePlaceholder}
          clearLabel={STRINGS.liveClear}
          value={query}
          onChange={search}
          isLoading={isSearching}
          onSubmit={(text) => setMessage(STRINGS.submitted(text))}
          onClear={() => setMessage(STRINGS.cleared)}
          className={SAMPLE}
        />
        <Text role="status" tone="muted">
          {isSearching ? "" : STRINGS.count(results.length)}
        </Text>
        <Text data-testid="search-message" tone="muted">
          {message}
        </Text>
        <ul aria-label={STRINGS.results} className="grid gap-1">
          {results.map((name) => (
            <li key={name}>
              <Text>{name}</Text>
            </li>
          ))}
        </ul>
      </PageSection>
    </article>
  );
}
