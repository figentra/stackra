/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native SearchField: with a value, required, invalid, disabled, read-only and loading.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SearchField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_DEMO_KEYS } from "#src/demos/free/search-field/search-field-demo-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_DEMO_KEYS.demo_free.search_field.states;

/** Disabled and read-only keep their text and hide the clear button. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const sample = t(K.sample);
  return (
    <View className="gap-4">
      <SearchField label={t(K.with_value)} defaultValue={sample} />
      <SearchField label={t(K.required)} isRequired />
      <SearchField
        label={t(K.invalid)}
        isInvalid
        errorMessage={t(K.invalid_error)}
        defaultValue="ab"
      />
      <SearchField label={t(K.disabled)} isDisabled defaultValue={sample} />
      <SearchField label={t(K.read_only)} isReadOnly defaultValue={sample} />
      <SearchField label={t(K.loading)} isLoading defaultValue={sample} />
    </View>
  );
}
