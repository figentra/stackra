/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Text field: Required adds the asterisk, invalid shows the error, disabled and
 *          read-only keep the value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { TextField as UiTextField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_KEYS } from "#src/demos/free/text-field/text-field-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_KEYS.text_field;

/** The grid that lays fields out in columns that wrap. */
const GRID = "grid gap-4 sm:grid-cols-2";

/** Text field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiTextField label={t(K.required)} isRequired />
      <UiTextField
        label={t(K.invalid)}
        isInvalid
        defaultValue="A"
        errorMessage={t(K.invalid_message)}
      />
      <UiTextField label={t(K.disabled)} isDisabled defaultValue={t(K.kept)} />
      <UiTextField label={t(K.read_only)} isReadOnly defaultValue={t(K.kept)} />
    </div>
  );
}
