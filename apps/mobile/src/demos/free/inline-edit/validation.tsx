/**
 * Stackra file contract:
 * Purpose: the "validation" demo of the native InlineEdit: a SKU and a required name that refuse a bad draft with an error haptic.
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
const K = INLINE_EDIT_DEMO_KEYS.demo_free.inline_edit.validation;

/** Two letters, a dash and four digits, such as CF-0042. */
const SKU = /^[A-Z]{2}-\d{4}$/;

/** Drafts that must pass a check. */
export default function Validation() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <InlineEdit
        label={t(K.sku)}
        defaultValue="CF-0042"
        validate={(draft) => (SKU.test(draft.trim()) ? undefined : t(K.sku_error))}
      />
      <InlineEdit
        label={t(K.store)}
        defaultValue={t(K.store_value)}
        isRequired
        validate={(draft) => (draft.trim() === "" ? t(K.name_required) : undefined)}
      />
    </View>
  );
}
