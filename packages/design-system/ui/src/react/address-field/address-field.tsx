/**
 * Stackra file contract:
 * Purpose: the web `AddressField`: a fieldset of the address lines, city, region, postal code and a CountrySelect, the
 *          value an `AddressValue`; each part has the browser's address autofill token.
 * Boundary: the parts are house TextFields; the legend is `label`. National formats (Saudi short address) ride in
 *           the lines for now.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.1, 1.3.5.
 */
import { cn } from "@heroui/react";
import { useState, type ReactElement } from "react";

import type { AddressValue } from "#contracts/types/address-value.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { CountrySelect } from "#react/country-select/country-select";
import { useUiText } from "#react/hooks/use-ui-text";
import { TextField } from "#react/text-field/text-field";
import type { AddressFieldProps } from "#react/address-field/address-field.props";

/** The text parts, their catalogue key and autofill token. */
const PARTS = [
  ["line1", "line1", "address-line1"],
  ["line2", "line2", "address-line2"],
  ["city", "city", "address-level2"],
  ["region", "region", "address-level1"],
  ["postalCode", "postal_code", "postal-code"],
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
  const flags = { isDisabled, isReadOnly };
  return (
    <fieldset className={cn("grid gap-3 sm:grid-cols-2", className) ?? ""} disabled={isDisabled}>
      {label ? <legend className="mb-2 text-sm font-medium text-foreground">{label}</legend> : null}
      {PARTS.map(([part, key, token]) => (
        <TextField
          key={part}
          {...(part.startsWith("line") ? { className: "sm:col-span-2" } : {})}
          label={t(K[key])}
          value={address[part] ?? ""}
          onChange={(text) => set({ [part]: text })}
          autoComplete={token}
          isRequired={Boolean(isRequired) && (part === "line1" || part === "city")}
          {...(flags.isDisabled ? { isDisabled: true } : {})}
          {...(flags.isReadOnly ? { isReadOnly: true } : {})}
        />
      ))}
      <CountrySelect
        label={t(K.country)}
        {...(countries ? { countries } : {})}
        value={address.country}
        onChange={(country) => set({ country: country ?? defaultCountry })}
        {...(isRequired ? { isRequired } : {})}
        {...(flags.isDisabled ? { isDisabled: true } : {})}
        {...(flags.isReadOnly ? { isReadOnly: true } : {})}
      />
      {description ? <p className="text-xs text-muted sm:col-span-2">{description}</p> : null}
    </fieldset>
  );
}
