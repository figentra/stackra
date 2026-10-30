/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Checkbox field: required and invalid with its message, disabled, and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CheckboxField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_FIELD_KEYS } from "#src/demos/free/checkbox-field/checkbox-field-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_FIELD_KEYS.checkbox_field;

/** Checkbox field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <CheckboxField isRequired isInvalid errorMessage={t(K.required_error)}>
        {t(K.required)}
      </CheckboxField>
      <CheckboxField defaultValue isDisabled>
        {t(K.disabled)}
      </CheckboxField>
      <CheckboxField defaultValue isReadOnly>
        {t(K.read_only)}
      </CheckboxField>
    </div>
  );
}
