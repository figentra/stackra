/**
 * Stackra file contract:
 * Purpose: the native `CountrySelect`: a searchable ComboBox of countries, each with its flag and its name in the
 *          active language, the preferred ones first.
 * Boundary: the list is `countryItemsOf`; the field is the house native ComboBox. The value is an ISO alpha-2 code.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import { useMemo, type ReactElement } from "react";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { countryItemsOf } from "#core/functions/country-items-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ComboBox } from "#native/combo-box/combo-box";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { CountrySelectProps } from "#native/country-select/country-select.props";

/** A searchable list of countries. */
export function CountrySelect({
  countries,
  preferred,
  label,
  isFullWidth = true,
  ...field
}: CountrySelectProps): ReactElement {
  const { locale } = useDesignSystem();
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
