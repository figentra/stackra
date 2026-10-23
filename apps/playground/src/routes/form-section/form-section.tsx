/**
 * Stackra file contract:
 * Purpose: the page of the form-section route: a section with only a title, one with a description, one holding
 *          several fields, a disabled section whose fields are disabled with it, and a live form of two sections where
 *          a switch disables the second, all from `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. Every section is a `fieldset`
 *           with a `legend`, so each is a named group; the fields inside keep their own labels.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0060 (light, dark,
 *          RTL); WCAG 2.2 SC 1.3.1.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { FormSectionRoute } from "#src/routes/form-section/form-section.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::form-section.*` keys.
const STRINGS = {
  documentTitle: `${FormSectionRoute.title} · Stackra Playground`,
  intro:
    "A form section groups related fields under a title, with an optional description. It is a named group for assistive technology, so the title is read before each field inside it.",
  variants: "Parts",
  variantsNote: "A title alone, a title with a description, and a section of several fields.",
  titleOnly: "Title only",
  withDescription: "With a description",
  description: "Where we send invoices and how we address you.",
  several: "Several fields",
  name: "Full name",
  company: "Company",
  country: "Country",
  states: "States",
  statesNote:
    "A disabled section disables every field inside it, so the group and its fields read as one.",
  disabledSection: "Disabled section",
  kept: "Kept value",
  live: "Try it",
  liveNote: "A form of two sections. The switch disables the second one.",
  liveName: "Billing form",
  profile: "Profile",
  profileDescription: "Shown on your invoices.",
  displayName: "Display name",
  billing: "Billing",
  billingDescription: "Used for the receipt.",
  address: "Billing address",
  vatNumber: "VAT number",
  disableBilling: "Disable the billing section",
} as const;

/** The grid that lays sections out in columns that wrap. */
const GRID = "grid gap-8 sm:grid-cols-2";

/** The FormSection page. */
export function FormSection() {
  const [isBillingDisabled, setIsBillingDisabled] = useState(false);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{FormSectionRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="form-section-parts" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className={GRID}>
          <Ui.FormSection title={STRINGS.titleOnly}>
            <Ui.TextField label={STRINGS.name} />
          </Ui.FormSection>
          <Ui.FormSection title={STRINGS.withDescription} description={STRINGS.description}>
            <Ui.TextField label={STRINGS.name} />
          </Ui.FormSection>
          <Ui.FormSection title={STRINGS.several}>
            <Ui.TextField label={STRINGS.company} />
            <Ui.TextField label={STRINGS.country} />
          </Ui.FormSection>
        </div>
      </PageSection>

      <PageSection id="form-section-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <Ui.FormSection title={STRINGS.disabledSection} disabled>
          <Ui.TextField label={STRINGS.company} defaultValue={STRINGS.kept} />
        </Ui.FormSection>
      </PageSection>

      <PageSection id="form-section-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Ui.Form aria-label={STRINGS.liveName} className="grid max-w-md gap-8">
          <Ui.FormSection title={STRINGS.profile} description={STRINGS.profileDescription}>
            <Ui.TextField label={STRINGS.displayName} />
          </Ui.FormSection>
          <Ui.FormSection
            title={STRINGS.billing}
            description={STRINGS.billingDescription}
            disabled={isBillingDisabled}
          >
            <Ui.TextField label={STRINGS.address} />
            <Ui.TextField label={STRINGS.vatNumber} />
          </Ui.FormSection>
          <Ui.Switch
            label={STRINGS.disableBilling}
            value={isBillingDisabled}
            onChange={setIsBillingDisabled}
          />
        </Ui.Form>
      </PageSection>
    </article>
  );
}
