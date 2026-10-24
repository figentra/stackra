/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `PhoneNumberField` (@stackra/ui-pro): a masked number input
 *          with a country picker, validation read from the value details, a restricted country list with a default
 *          country, and the disabled state.
 * Boundary: presentation and local demo state only; the field is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Description, FieldError, Label, Text } from "@stackra/ui/native";
import { PhoneNumberField, type PhoneNumberFieldProps } from "@stackra/ui-pro/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Country picker and mask",
    description:
      "The number is grouped as you type for the chosen country; picking another country clears it.",
    label: "Phone number",
    hint: "We will send a verification code to this number.",
    country: "Country:",
    e164: "International format:",
    none: "nothing yet",
  },
  validation: {
    title: "Validation",
    description:
      "`isInvalid` follows the value details: it shows once a number is typed and is not valid.",
    label: "Mobile number",
    hint: "Include the area code.",
    error: "Enter a valid phone number.",
  },
  restricted: {
    title: "Restricted countries",
    description:
      "`countries` limits and orders the picker; `defaultCountry` chooses the first one.",
    label: "Gulf contact number",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` turns off the input and the country picker.",
    label: "Locked number",
  },
  countryPicker: "Choose a country",
  search: "Search countries",
} as const;

/** The value details the field reports, taken from its own props so the page repeats no type. */
type Details = Parameters<NonNullable<PhoneNumberFieldProps["onValueChange"]>>[0];

/** The countries of the restricted list; the flag is the emoji of its ISO code. */
const GULF_COUNTRIES: NonNullable<PhoneNumberFieldProps["countries"]> = [
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
];

/** Props of {@link PhoneEntry}. */
interface PhoneEntryProps extends Omit<PhoneNumberFieldProps, "children"> {
  /** The visible field name; also the accessible name of the field. */
  label: string;
  /** Help text under the field, hidden while the field is invalid. */
  hint?: string;
  /** The message shown while the field is invalid. */
  error?: string;
}

/** One labelled field: name, country picker, masked input, help and error text. */
function PhoneEntry({ label, hint, error, ...rest }: PhoneEntryProps) {
  return (
    <PhoneNumberField label={label} {...rest}>
      <Label>{label}</Label>
      <PhoneNumberField.InputGroup>
        <PhoneNumberField.Prefix>
          <PhoneNumberField.Select>
            <PhoneNumberField.Trigger accessibilityLabel={STRINGS.countryPicker} />
            <PhoneNumberField.Portal>
              <PhoneNumberField.Overlay />
              <PhoneNumberField.Content>
                <PhoneNumberField.ContentHandle />
                <PhoneNumberField.SearchInput accessibilityLabel={STRINGS.search} />
                <PhoneNumberField.CountryList />
              </PhoneNumberField.Content>
            </PhoneNumberField.Portal>
          </PhoneNumberField.Select>
        </PhoneNumberField.Prefix>
        <PhoneNumberField.Input accessibilityLabel={label} />
      </PhoneNumberField.InputGroup>
      {hint ? <Description hideOnInvalid>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </PhoneNumberField>
  );
}

/** The PhoneNumberField page: one section per option and state, in a scrollable screen. */
export function PhoneNumberFieldScreen() {
  const [basic, setBasic] = useState<Details>();
  const [checked, setChecked] = useState<Details>();
  const isInvalid = checked !== undefined && checked.nationalNumber !== "" && !checked.isValid;

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <PhoneEntry
          label={STRINGS.basic.label}
          hint={STRINGS.basic.hint}
          onValueChange={setBasic}
        />
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.basic.country} ${basic?.country.name ?? STRINGS.basic.none}`}
        </Text>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.basic.e164} ${basic?.e164 || STRINGS.basic.none}`}
        </Text>
      </Section>

      <Section title={STRINGS.validation.title} description={STRINGS.validation.description}>
        <PhoneEntry
          label={STRINGS.validation.label}
          hint={STRINGS.validation.hint}
          error={STRINGS.validation.error}
          isRequired
          isInvalid={isInvalid}
          onValueChange={setChecked}
        />
      </Section>

      <Section title={STRINGS.restricted.title} description={STRINGS.restricted.description}>
        <PhoneEntry
          label={STRINGS.restricted.label}
          countries={GULF_COUNTRIES}
          defaultCountry="AE"
        />
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <PhoneEntry label={STRINGS.disabled.label} isDisabled defaultValue="5551234567" />
      </Section>
    </Screen>
  );
}
