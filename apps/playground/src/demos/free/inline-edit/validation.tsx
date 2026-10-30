/**
 * Stackra file contract:
 * Purpose: the "validation" demo of the web InlineEdit: a SKU and a required name that refuse a bad draft and stay open.
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

/** Two letters, a dash and four digits, such as CF-0042. */
const SKU = /^[A-Z]{2}-\d{4}$/;

/** Inline edit: Validation. */
export default function Validation() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-md gap-4">
      <UiInlineEdit
        label={t(K.sku)}
        defaultValue="CF-0042"
        validate={(draft) => (SKU.test(draft.trim()) ? undefined : t(K.sku_error))}
      />
      <UiInlineEdit
        label={t(K.store)}
        defaultValue={t(K.store_value)}
        isRequired
        validate={(draft) => (draft.trim() === "" ? t(K.name_required) : undefined)}
      />
    </div>
  );
}
