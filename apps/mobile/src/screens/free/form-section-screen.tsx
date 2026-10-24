/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `FormSection` (@stackra/ui): a title alone, a title with a
 *          description, a section of several fields, and a live form of two sections whose second one a switch
 *          disables.
 * Boundary: presentation and local demo state only; the section is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { Form, FormSection, Switch, TextField } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  parts: {
    title: "Parts",
    description: "A `title` alone, a title with a `description`, and a section of several fields.",
    titleOnly: "Title only",
    withDescription: "With a description",
    hint: "Where we send invoices and how we address you.",
    several: "Several fields",
    name: "Full name",
    company: "Company",
    country: "Country",
  },
  live: {
    title: "Try it",
    description:
      "A form of two sections. The switch disables every field of the second one; the section itself has no disabled state.",
    profile: "Profile",
    profileHint: "Shown on your invoices.",
    displayName: "Display name",
    billing: "Billing",
    billingHint: "Used for the receipt.",
    address: "Billing address",
    vatNumber: "VAT number",
    disable: "Disable the billing section",
  },
} as const;

/** The FormSection page: one section per option, in a scrollable screen. */
export function FormSectionScreen() {
  const [isBillingDisabled, setIsBillingDisabled] = useState(false);

  return (
    <Screen>
      <Section title={STRINGS.parts.title} description={STRINGS.parts.description}>
        <FormSection title={STRINGS.parts.titleOnly}>
          <TextField label={STRINGS.parts.name} />
        </FormSection>
        <FormSection title={STRINGS.parts.withDescription} description={STRINGS.parts.hint}>
          <TextField label={STRINGS.parts.name} />
        </FormSection>
        <FormSection title={STRINGS.parts.several}>
          <TextField label={STRINGS.parts.name} />
          <TextField label={STRINGS.parts.company} />
          <TextField label={STRINGS.parts.country} />
        </FormSection>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Form style={{ gap: 24 }}>
          <FormSection title={STRINGS.live.profile} description={STRINGS.live.profileHint}>
            <TextField label={STRINGS.live.displayName} />
          </FormSection>
          <Switch
            label={STRINGS.live.disable}
            value={isBillingDisabled}
            onChange={setIsBillingDisabled}
          />
          <FormSection title={STRINGS.live.billing} description={STRINGS.live.billingHint}>
            <TextField label={STRINGS.live.address} isDisabled={isBillingDisabled} />
            <TextField label={STRINGS.live.vatNumber} isDisabled={isBillingDisabled} />
          </FormSection>
        </Form>
      </Section>
    </Screen>
  );
}
