/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the web Form section: A title alone, a title with a description, and a section of
 *          several fields.
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

/** The grid that lays sections out in columns that wrap. */
const GRID = "grid gap-8 sm:grid-cols-2";

/** Form section: Parts. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={GRID}>
      <UiFormSection title={t(K.title_only)}>
        <TextField label={t(K.name)} />
      </UiFormSection>
      <UiFormSection title={t(K.with_description)} description={t(K.description)}>
        <TextField label={t(K.name)} />
      </UiFormSection>
      <UiFormSection title={t(K.several)}>
        <TextField label={t(K.company)} />
        <TextField label={t(K.country)} />
      </UiFormSection>
    </div>
  );
}
