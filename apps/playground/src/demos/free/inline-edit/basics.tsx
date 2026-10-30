/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web InlineEdit: rename a branch in the OS admin and edit an Arabic product name in place.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 5; ADR 0060
 *          (light, dark, RTL).
 */
import { InlineEdit as UiInlineEdit, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_EDIT_KEYS } from "#src/demos/free/inline-edit/inline-edit-keys.constant";

/** The demo's keys. */
const K = INLINE_EDIT_KEYS.inline_edit;

/** Inline edit: Edit in place. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [store, setStore] = useState(() => t(K.store_value));
  return (
    <div className="grid max-w-md gap-4">
      <UiInlineEdit label={t(K.store)} value={store} onChange={setStore} />
      <UiInlineEdit label={t(K.product)} defaultValue={t(K.product_value)} />
      <UiInlineEdit label={t(K.note)} placeholder={t(K.note_placeholder)} />
      <Text tone="muted" type="small" aria-live="polite">
        {t(K.saved, { value: store })}
      </Text>
    </div>
  );
}
