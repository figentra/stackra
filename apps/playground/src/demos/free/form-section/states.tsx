/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Form section: A disabled section disables every field inside it, so the group
 *          and its fields read as one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1.
 */
import { FormSection as UiFormSection, TextField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_SECTION_KEYS } from "#src/demos/free/form-section/form-section-keys.constant";

/** The demo's keys. */
const K = FORM_SECTION_KEYS.form_section;

/** Form section: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiFormSection title={t(K.disabled_section)} disabled>
      <TextField label={t(K.company)} defaultValue={t(K.kept)} />
    </UiFormSection>
  );
}
