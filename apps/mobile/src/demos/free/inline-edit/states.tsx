/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native InlineEdit: a read-only tax number and a disabled value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 5; ADR 0310
 *          (decision 6).
 */
import { InlineEdit, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_EDIT_DEMO_KEYS } from "#src/demos/free/inline-edit/inline-edit-demo-keys.constant";

/** The demo's keys. */
const K = INLINE_EDIT_DEMO_KEYS.demo_free.inline_edit.states;

/** Read-only and disabled. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <InlineEdit label={t(K.read_only)} defaultValue={t(K.tax_value)} isReadOnly />
      <InlineEdit label={t(K.disabled)} defaultValue={t(K.store_value)} isDisabled />
    </View>
  );
}
