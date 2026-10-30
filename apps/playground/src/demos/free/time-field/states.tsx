/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Time field: States.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { TimeField, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIME_FIELD_KEYS } from "#src/demos/free/time-field/time-field-keys.constant";

/** The demo's keys. */
const K = TIME_FIELD_KEYS.time_field.states;

/** Time field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <TimeField
        label={t(K.invalid)}
        errorMessage={t(K.invalid_message)}
        isInvalid
        defaultValue={{ hour: 23, minute: 15 }}
      />
      <TimeField label={t(K.read_only)} isReadOnly defaultValue={{ hour: 14, minute: 5 }} />
      <TimeField label={t(K.disabled)} isDisabled defaultValue={{ hour: 13, minute: 0 }} />
    </div>
  );
}
