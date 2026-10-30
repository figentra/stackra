/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native SearchField: it filters as it is typed and is busy for a moment after each change.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SearchField, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_DEMO_KEYS } from "#src/demos/free/search-field/search-field-demo-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_DEMO_KEYS.demo_free.search_field.live;

/** How long the pretend search runs, in milliseconds. */
const SEARCH_MILLISECONDS = 400;

/** The products the search filters. */
const PRODUCTS = ["blue_shirt", "white_shirt", "coffee_mug", "desk_lamp", "floor_lamp"] as const;

/** The search key submits the text and the clear button empties it. */
export default function Live() {
  const [text, setText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [event, setEvent] = useState<
    { readonly kind: "none" | "cleared" } | { readonly kind: "submitted"; readonly text: string }
  >({
    kind: "none",
  });
  const t = useCatalogueText(MESSAGES.en);
  const found = PRODUCTS.map((product) => t(K.products[product])).filter((name) =>
    name.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase()),
  );

  // The timer is cleared when the text changes again, so only the last search ends the busy state.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a demo of a busy state: the effect starts a pretend request and marks it busy
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), SEARCH_MILLISECONDS);
    return () => clearTimeout(timer);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the search text is the trigger of the pretend request this demo shows
  }, [text]);

  return (
    <View className="gap-2">
      <SearchField
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        clearLabel={t(K.clear)}
        isLoading={isSearching}
        value={text}
        onChange={setText}
        onSubmit={(value) => setEvent({ kind: "submitted", text: value })}
        onClear={() => setEvent({ kind: "cleared" })}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.count, { count: found.length })}
      </Text>
      {found.map((name) => (
        <Text key={name}>{name}</Text>
      ))}
      <Text tone="muted" accessibilityLiveRegion="polite">
        {event.kind === "submitted" ? t(K.submitted, { text: event.text }) : t(K[event.kind])}
      </Text>
    </View>
  );
}
