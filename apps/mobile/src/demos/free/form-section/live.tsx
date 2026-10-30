/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native FormSection: a switch disables every field of the second section.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Form, FormSection, Switch, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_SECTION_DEMO_KEYS } from "#src/demos/free/form-section/form-section-demo-keys.constant";

/** The demo's keys. */
const K = FORM_SECTION_DEMO_KEYS.demo_free.form_section.live;

/** The section itself has no disabled state: its fields carry it. */
export default function Live() {
  const [isBillingDisabled, setIsBillingDisabled] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Form style={{ gap: 24 }}>
      <FormSection title={t(K.profile)} description={t(K.profile_hint)}>
        <TextField label={t(K.display_name)} />
      </FormSection>
      <Switch label={t(K.disable)} value={isBillingDisabled} onChange={setIsBillingDisabled} />
      <FormSection title={t(K.billing)} description={t(K.billing_hint)}>
        <TextField label={t(K.address)} isDisabled={isBillingDisabled} />
        <TextField label={t(K.vat_number)} isDisabled={isBillingDisabled} />
      </FormSection>
    </Form>
  );
}
