/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native SearchField: a label, a label with a description, and an `accessibilityLabel` alone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SearchField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_DEMO_KEYS } from "#src/demos/free/search-field/search-field-demo-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_DEMO_KEYS.demo_free.search_field.basics;

/** Three ways to name the field. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <SearchField label={t(K.label)} placeholder={t(K.placeholder)} />
      <SearchField
        label={t(K.described)}
        description={t(K.hint)}
        placeholder={t(K.described_placeholder)}
      />
      <SearchField accessibilityLabel={t(K.hidden_name)} placeholder={t(K.hidden_name)} />
    </View>
  );
}
