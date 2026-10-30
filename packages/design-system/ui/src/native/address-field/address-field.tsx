/**
 * Stackra file contract:
 * Purpose: the native `AddressField`: the address lines, city, region, postal code and a CountrySelect stacked under
 *          one label, the value an `AddressValue`; each part has the platform's address autofill hint.
 * Boundary: the parts are house TextFields; national formats ride in the lines for now.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.5.
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import type { AddressValue } from "#contracts/types/address-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { CountrySelect } from "#native/country-select/country-select";
import { Text } from "#native/text/text";
import { TextField } from "#native/text-field/text-field";
import type { AddressFieldProps } from "#native/address-field/address-field.props";

/** The text parts, their catalogue key and iOS autofill hint. */
const PARTS = [
  ["line1", "line1", "streetAddressLine1"],
  ["line2", "line2", "streetAddressLine2"],
  ["city", "city", "addressCity"],
  ["region", "region", "addressState"],
  ["postalCode", "postal_code", "postalCode"],
] as const;

/** A postal address. */
export function AddressField({
  label,
  description,
  countries,
  defaultCountry = "SA",
  value,
  defaultValue,
  onChange,
  isRequired,
  isDisabled,
  isReadOnly,
  className,
}: AddressFieldProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.address_field;
  const [own, setOwn] = useState<AddressValue>(
    defaultValue ?? { line1: "", city: "", country: defaultCountry },
  );
  const address = value ?? own;
  const set = (patch: Partial<AddressValue>) => {
    const next = { ...address, ...patch };
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const flags = { ...(isDisabled ? { isDisabled } : {}), ...(isReadOnly ? { isReadOnly } : {}) };
  return (
    <View className={`gap-3 ${className ?? ""}`}>
      {label == null ? null : (
        <Text className="font-medium" accessibilityRole="header">
          {label}
        </Text>
      )}
      {PARTS.map(([part, key, hint]) => (
        <TextField
          key={part}
          label={t(K[key])}
          value={address[part] ?? ""}
          onChange={(text) => set({ [part]: text })}
          textContentType={hint}
          {...(isRequired && (part === "line1" || part === "city") ? { isRequired: true } : {})}
          {...flags}
        />
      ))}
      <CountrySelect
        label={t(K.country)}
        {...(countries ? { countries } : {})}
        value={address.country}
        onChange={(country) => set({ country: country ?? defaultCountry })}
        {...flags}
      />
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
    </View>
  );
}
