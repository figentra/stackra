/**
 * Stackra file contract:
 * Purpose: the "consent" demo of the web Checkbox field: a terms box whose label is a sentence with emphasis; the line under it
 *          follows the choice.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CheckboxField, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_FIELD_KEYS } from "#src/demos/free/checkbox-field/checkbox-field-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_FIELD_KEYS.checkbox_field;

/** Checkbox field: Consent. */
export default function Consent() {
  const t = useCatalogueText(MESSAGES.en);
  const [isAgreed, setAgreed] = useState(false);
  return (
    <div className="grid gap-3">
      <CheckboxField name="terms" value={isAgreed} onChange={setAgreed}>
        {t(K.agree)} <strong>{t(K.terms)}</strong>
      </CheckboxField>
      <Text type="small" tone="muted" aria-live="polite">
        {t(isAgreed ? K.agreed : K.not_agreed)}
      </Text>
    </div>
  );
}
