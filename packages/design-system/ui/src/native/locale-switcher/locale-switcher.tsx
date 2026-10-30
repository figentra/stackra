/**
 * Stackra file contract:
 * Purpose: the native `LocaleSwitcher`: the app's languages, each written in itself ("العربية", "English"), in the
 *          house native Select.
 * Boundary: the names are `localeNameOf` (Intl); the switch itself (direction per subtree, persistence) is the app's.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0403.
 */
import type { ReactElement } from "react";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { localeNameOf } from "#core/functions/locale-name-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Select } from "#native/select/select";
import type { LocaleSwitcherProps } from "#native/locale-switcher/locale-switcher.props";

/** The app's language. */
export function LocaleSwitcher({
  locales,
  value,
  onChange,
  label,
  className,
}: LocaleSwitcherProps): ReactElement {
  const t = useUiText();
  return (
    <Select
      label={label ?? t(FORMS_KEYS.ui.locale_switcher.label)}
      items={locales.map((tag) => ({ id: tag, label: localeNameOf(tag) }))}
      value={value}
      onChange={(next) => {
        if (next) onChange?.(next);
      }}
      {...(className ? { className } : {})}
    />
  );
}
