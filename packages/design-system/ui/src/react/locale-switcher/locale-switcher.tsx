/**
 * Stackra file contract:
 * Purpose: the web `LocaleSwitcher`: the app's languages, each written in itself ("العربية", "English"), in the house
 *          Select.
 * Boundary: the names are `localeNameOf` (Intl); the switch itself (direction, reload, persistence) is the app's.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0403; WCAG 2.2
 *          SC 3.1.2.
 */
import type { ReactElement } from "react";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { localeNameOf } from "#core/functions/locale-name-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Select } from "#react/select/select";
import type { LocaleSwitcherProps } from "#react/locale-switcher/locale-switcher.props";

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
