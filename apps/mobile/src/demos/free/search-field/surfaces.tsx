/**
 * Stackra file contract:
 * Purpose: the "surfaces" demo of the native SearchField: `primary` is the field colour; `secondary` sits on a card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SearchField, Surface, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_DEMO_KEYS } from "#src/demos/free/search-field/search-field-demo-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_DEMO_KEYS.demo_free.search_field.surfaces;

/** Each variant where it belongs. */
export default function Surfaces() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <SearchField label={t(K.primary)} variant="primary" />
      <Surface variant="secondary">
        <SearchField label={t(K.secondary)} variant="secondary" />
      </Surface>
    </View>
  );
}
