/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Form section: A form of two sections. The switch disables the second one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.3.1.
 */
import {
  Form,
  FormSection as UiFormSection,
  Switch,
  TextField,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_SECTION_KEYS } from "#src/demos/free/form-section/form-section-keys.constant";

/** The demo's keys. */
const K = FORM_SECTION_KEYS.form_section;

/** Form section: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isBillingDisabled, setIsBillingDisabled] = useState(false);

  return (
    <Form aria-label={t(K.live_name)} className="grid max-w-md gap-8">
      <UiFormSection title={t(K.profile)} description={t(K.profile_description)}>
        <TextField label={t(K.display_name)} />
      </UiFormSection>
      <UiFormSection
        title={t(K.billing)}
        description={t(K.billing_description)}
        disabled={isBillingDisabled}
      >
        <TextField label={t(K.address)} />
        <TextField label={t(K.vat_number)} />
      </UiFormSection>
      <Switch
        label={t(K.disable_billing)}
        value={isBillingDisabled}
        onChange={setIsBillingDisabled}
      />
    </Form>
  );
}
