/**
 * Stackra file contract:
 * Purpose: the "parts" demo of the native FormSection: a `title` alone, with a `description`, and several fields.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { FormSection, TextField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_SECTION_DEMO_KEYS } from "#src/demos/free/form-section/form-section-demo-keys.constant";

/** The demo's keys. */
const K = FORM_SECTION_DEMO_KEYS.demo_free.form_section.parts;

/** The FormSection demo: three sections of a form. */
export default function Parts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-6">
      <FormSection title={t(K.title_only)}>
        <TextField label={t(K.name)} />
      </FormSection>
      <FormSection title={t(K.with_description)} description={t(K.hint)}>
        <TextField label={t(K.name)} />
      </FormSection>
      <FormSection title={t(K.several)}>
        <TextField label={t(K.name)} />
        <TextField label={t(K.company)} />
        <TextField label={t(K.country)} />
      </FormSection>
    </View>
  );
}
