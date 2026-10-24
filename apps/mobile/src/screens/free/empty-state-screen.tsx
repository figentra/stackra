/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `EmptyState` (@stackra/ui): one state per reason, a custom icon
 *          and none, actions for the next step, and a live list that falls back to the empty state when a search
 *          matches nothing and offers to clear it.
 * Boundary: presentation and local demo state only; the empty state is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { EmptyReason } from "@stackra/ui/contracts";
import { Button, EmptyState, SearchField, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  reasons: {
    title: "Reasons",
    description:
      "`reason` says why nothing is shown and picks the icon: no data yet, no match for a search, or no permission.",
    titles: {
      "no-data": "No invoices yet",
      "no-results": "No invoices match",
      "permission-denied": "You cannot see invoices",
    },
    descriptions: {
      "no-data": "Invoices you create will appear here.",
      "no-results": "Try a different word, or clear the search.",
      "permission-denied": "Ask an administrator for access to billing.",
    },
  },
  icons: {
    title: "Icons",
    description: "`icon` replaces the reason's icon with another by name, and `false` draws none.",
    custom: "Nothing to be notified about",
    customBody: "You are all caught up.",
    none: "A state without an icon",
    noneBody: "The title and the description carry the whole message.",
  },
  actions: {
    title: "With actions",
    description: "`actions` are the reader's next step, drawn under the description.",
    heading: "Start your first invoice",
    body: "Create an invoice, or import the ones you already have.",
    create: "Create an invoice",
    import: "Import",
  },
  live: {
    title: "Try it",
    description:
      "Search the list: when nothing matches, the list is replaced by an empty state with a way back.",
    label: "Search the fruit",
    results: (count: number) => (count === 1 ? "1 fruit" : `${count} fruits`),
    heading: "No fruit matches",
    body: (query: string) => `Nothing is called “${query}”.`,
    clear: "Clear the search",
  },
} as const;

/** The list of the live sample. */
const FRUIT = ["Apple", "Apricot", "Banana", "Cherry", "Fig", "Grape", "Lemon", "Mango"] as const;

/** The EmptyState page: one section per option, in a scrollable screen. */
export function EmptyStateScreen() {
  const [query, setQuery] = useState("");
  const matches = FRUIT.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Screen>
      <Section title={STRINGS.reasons.title} description={STRINGS.reasons.description}>
        {EmptyReason.map((reason) => (
          <EmptyState
            key={reason}
            reason={reason}
            headingLevel={3}
            title={STRINGS.reasons.titles[reason]}
            description={STRINGS.reasons.descriptions[reason]}
          />
        ))}
      </Section>

      <Section title={STRINGS.icons.title} description={STRINGS.icons.description}>
        <EmptyState
          headingLevel={3}
          icon="bell"
          title={STRINGS.icons.custom}
          description={STRINGS.icons.customBody}
        />
        <EmptyState
          headingLevel={3}
          icon={false}
          title={STRINGS.icons.none}
          description={STRINGS.icons.noneBody}
        />
      </Section>

      <Section title={STRINGS.actions.title} description={STRINGS.actions.description}>
        <EmptyState
          headingLevel={3}
          title={STRINGS.actions.heading}
          description={STRINGS.actions.body}
          actions={
            <>
              <Button>{STRINGS.actions.create}</Button>
              <Button variant="secondary">{STRINGS.actions.import}</Button>
            </>
          }
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <SearchField
          accessibilityLabel={STRINGS.live.label}
          placeholder={STRINGS.live.label}
          value={query}
          onChange={setQuery}
        />
        {matches.length === 0 ? (
          <EmptyState
            reason="no-results"
            headingLevel={3}
            title={STRINGS.live.heading}
            description={STRINGS.live.body(query.trim())}
            actions={
              <Button variant="secondary" onPress={() => setQuery("")}>
                {STRINGS.live.clear}
              </Button>
            }
          />
        ) : (
          <>
            <Text tone="muted" accessibilityLiveRegion="polite">
              {STRINGS.live.results(matches.length)}
            </Text>
            {matches.map((name) => (
              <Text key={name}>{name}</Text>
            ))}
          </>
        )}
      </Section>
    </Screen>
  );
}
