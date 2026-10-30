/**
 * Stackra file contract:
 * Purpose: the "full-width" demo of the native SearchField: `isFullWidth` fills the parent.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SearchField, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_DEMO_KEYS } from "#src/demos/free/search-field/search-field-demo-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_DEMO_KEYS.demo_free.search_field.full_width;

/** As wide as its parent. */
export default function FullWidth() {
  const t = useCatalogueText(MESSAGES.en);
  return <SearchField label={t(K.label)} isFullWidth />;
}
