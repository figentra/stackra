/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web InlineEdit: a read-only tax number and a disabled value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 5; ADR 0060
 *          (light, dark, RTL).
 */
import { InlineEdit as UiInlineEdit, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_EDIT_KEYS } from "#src/demos/free/inline-edit/inline-edit-keys.constant";

/** The demo's keys. */
const K = INLINE_EDIT_KEYS.inline_edit;

/** Inline edit: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-md gap-4">
      <UiInlineEdit label={t(K.read_only)} defaultValue={t(K.tax_value)} isReadOnly />
      <UiInlineEdit label={t(K.disabled)} defaultValue={t(K.store_value)} isDisabled />
    </div>
  );
}
