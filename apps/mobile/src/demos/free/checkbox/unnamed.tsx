/**
 * Stackra file contract:
 * Purpose: the "unnamed" demo of the native Checkbox: no visible label, an accessible name instead.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Checkbox, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_DEMO_KEYS } from "#src/demos/free/checkbox/checkbox-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_DEMO_KEYS.demo_free.checkbox.unnamed;

/** A row selector, as a table has. */
export default function Unnamed() {
  const t = useCatalogueText(MESSAGES.en);
  return <Checkbox accessibilityLabel={t(K.row_selector)} />;
}
