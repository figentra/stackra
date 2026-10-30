/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native EmptyState: a search that matches nothing shows it with a way back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, EmptyState, SearchField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { EMPTY_STATE_DEMO_KEYS } from "#src/demos/free/empty-state/empty-state-demo-keys.constant";

/** The demo's keys. */
const K = EMPTY_STATE_DEMO_KEYS.demo_free.empty_state.live;

/** The fruit of the list. */
const FRUIT = ["apple", "apricot", "banana", "cherry", "fig", "grape", "lemon", "mango"] as const;

/** Search the list; no match replaces it with an empty state. */
export default function Live() {
  const [query, setQuery] = useState("");
  const t = useCatalogueText(MESSAGES.en);
  const names = FRUIT.map((fruit) => t(K.fruit[fruit]));
  const matches = names.filter((name) =>
    name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <View className="gap-3">
      <SearchField
        accessibilityLabel={t(K.label)}
        placeholder={t(K.label)}
        value={query}
        onChange={setQuery}
      />
      {matches.length === 0 ? (
        <EmptyState
          reason="no-results"
          headingLevel={3}
          title={t(K.heading)}
          description={t(K.body, { query: query.trim() })}
          actions={
            <Button variant="secondary" onPress={() => setQuery("")}>
              {t(K.clear)}
            </Button>
          }
        />
      ) : (
        <>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {t(K.results, { count: matches.length })}
          </Text>
          {matches.map((name) => (
            <Text key={name}>{name}</Text>
          ))}
        </>
      )}
    </View>
  );
}
