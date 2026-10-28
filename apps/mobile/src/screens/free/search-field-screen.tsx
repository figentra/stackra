/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SearchField` (@stackra/ui): a labelled, a described and an
 *          unlabelled field, the two surfaces, full width, each state, and a live search that is busy for a moment,
 *          reports the submitted text and the clear.
 * Boundary: presentation and local demo state only; the field is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { SearchField, Surface, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** How long the pretend search runs, in milliseconds. */
const SEARCH_MILLISECONDS = 400;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "A visible label, a label with a description, and a field with no visible label that is named by `accessibilityLabel`.",
    label: "Search products",
    placeholder: "Name or SKU",
    described: "Search orders",
    describedPlaceholder: "Order number",
    hint: "Search by order number, customer or date.",
    hiddenName: "Search the help centre",
  },
  surfaces: {
    title: "Surfaces",
    description: "`primary` is the field colour; `secondary` is for a field on a card or panel.",
    primary: "Primary",
    secondary: "Secondary",
  },
  fullWidth: {
    title: "Full width",
    description: "`isFullWidth` fills the width of the parent.",
    label: "Full width",
  },
  states: {
    title: "States",
    description:
      "Each state, with a value where the clear button matters. Disabled and read-only keep their text and hide the clear button.",
    withValue: "With a value",
    required: "Required",
    invalid: "Invalid",
    invalidError: "Enter at least three characters.",
    disabled: "Disabled",
    readOnly: "Read-only",
    loading: "Loading",
    sample: "Blue shirt",
  },
  live: {
    title: "Try it",
    description:
      "Type to filter the products; the field is busy while it searches. The search key submits the text and the clear button empties it.",
    label: "Find a product",
    placeholder: "Try shirt, mug or lamp",
    clear: "Clear the product search",
    count: (total: number) => (total === 1 ? "1 product found." : `${total} products found.`),
    submitted: (text: string) => `Submitted: ${text}`,
    cleared: "Cleared the search.",
    none: "Nothing yet.",
  },
} as const;

/** The products the live search filters. */
const PRODUCTS = ["Blue shirt", "White shirt", "Coffee mug", "Desk lamp", "Floor lamp"] as const;

/** The live search: filters as it is typed, busy for a moment after each change. */
function LiveSearch() {
  const [text, setText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [event, setEvent] = useState<string>(STRINGS.live.none);
  const found = PRODUCTS.filter((product) =>
    product.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase()),
  );

  // The timer is cleared when the text changes again, so only the last search ends the busy state.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a demo of a busy state: the effect starts a pretend request and marks it busy
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), SEARCH_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <>
      <SearchField
        label={STRINGS.live.label}
        placeholder={STRINGS.live.placeholder}
        clearLabel={STRINGS.live.clear}
        isLoading={isSearching}
        value={text}
        onChange={setText}
        onSubmit={(value) => setEvent(STRINGS.live.submitted(value))}
        onClear={() => setEvent(STRINGS.live.cleared)}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.live.count(found.length)}
      </Text>
      {found.map((product) => (
        <Text key={product}>{product}</Text>
      ))}
      <Text tone="muted" accessibilityLiveRegion="polite">
        {event}
      </Text>
    </>
  );
}

/** The SearchField page: one section per option, in a scrollable screen. */
export function SearchFieldScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <SearchField label={STRINGS.basics.label} placeholder={STRINGS.basics.placeholder} />
        <SearchField
          label={STRINGS.basics.described}
          description={STRINGS.basics.hint}
          placeholder={STRINGS.basics.describedPlaceholder}
        />
        <SearchField
          accessibilityLabel={STRINGS.basics.hiddenName}
          placeholder={STRINGS.basics.hiddenName}
        />
      </Section>

      <Section title={STRINGS.surfaces.title} description={STRINGS.surfaces.description}>
        <SearchField label={STRINGS.surfaces.primary} variant="primary" />
        <Surface variant="secondary">
          <SearchField label={STRINGS.surfaces.secondary} variant="secondary" />
        </Surface>
      </Section>

      <Section title={STRINGS.fullWidth.title} description={STRINGS.fullWidth.description}>
        <SearchField label={STRINGS.fullWidth.label} isFullWidth />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <SearchField label={STRINGS.states.withValue} defaultValue={STRINGS.states.sample} />
        <SearchField label={STRINGS.states.required} isRequired />
        <SearchField
          label={STRINGS.states.invalid}
          isInvalid
          errorMessage={STRINGS.states.invalidError}
          defaultValue="ab"
        />
        <SearchField
          label={STRINGS.states.disabled}
          isDisabled
          defaultValue={STRINGS.states.sample}
        />
        <SearchField
          label={STRINGS.states.readOnly}
          isReadOnly
          defaultValue={STRINGS.states.sample}
        />
        <SearchField
          label={STRINGS.states.loading}
          isLoading
          defaultValue={STRINGS.states.sample}
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveSearch />
      </Section>
    </Screen>
  );
}
