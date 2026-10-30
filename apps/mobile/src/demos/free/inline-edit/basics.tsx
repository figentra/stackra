/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native InlineEdit: rename a branch and edit an Arabic product name in place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 5; ADR 0310
 *          (decision 6).
 */
import { InlineEdit, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_EDIT_DEMO_KEYS } from "#src/demos/free/inline-edit/inline-edit-demo-keys.constant";

/** The demo's keys. */
const K = INLINE_EDIT_DEMO_KEYS.demo_free.inline_edit.basics;

/** Tap a value to edit it. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [store, setStore] = useState(() => t(K.store_value));
  return (
    <View className="gap-4">
      <InlineEdit label={t(K.store)} value={store} onChange={setStore} />
      <InlineEdit label={t(K.product)} defaultValue={t(K.product_value)} />
      <InlineEdit label={t(K.note)} placeholder={t(K.note_placeholder)} />
      <Text tone="muted" type="small" accessibilityLiveRegion="polite">
        {t(K.saved, { value: store })}
      </Text>
    </View>
  );
}
