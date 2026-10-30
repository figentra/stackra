/**
 * Stackra file contract:
 * Purpose: the web `CountrySelect`: a searchable ComboBox of countries, each with its flag and its name in the active
 *          language, the preferred ones (the market's) first.
 * Boundary: the list is `countryItemsOf` (Intl names, collated in the locale); the field is the house ComboBox, so
 *           typing filters and the keyboard is React Aria's. The value is an ISO 3166-1 alpha-2 code.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import { useMemo, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { countryItemsOf } from "#core/functions/country-items-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { ComboBox } from "#react/combo-box/combo-box";
import { useUiText } from "#react/hooks/use-ui-text";
import type { CountrySelectProps } from "#react/country-select/country-select.props";

/** A searchable list of countries. */
export function CountrySelect({
  countries,
  preferred,
  label,
  isFullWidth = true,
  ...field
}: CountrySelectProps): ReactElement {
  const { locale } = useLocale();
  const t = useUiText();
  const items = useMemo(
    () => countryItemsOf({ locale, countries, preferred }),
    [locale, countries, preferred],
  );
  return (
    <ComboBox
      {...omitUndefined(field)}
      label={label ?? t(FORMS_KEYS.ui.country_select.label)}
      items={items}
      isFullWidth={isFullWidth}
    />
  );
}
