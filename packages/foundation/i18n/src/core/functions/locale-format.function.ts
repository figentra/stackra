/**
 * Stackra file contract:
 * Purpose: `localeFormat(locale, override)`, the week start and clock one locale is shown with: the `Locale`'s case
 *          data, overlaid by the configured override for that locale (`I18nConfig.formats[locale]`).
 * Boundary: pure. The override is configuration the caller reads (a member's `I18nConfig`, a tenant or user setting);
 *           nothing here names a Market.
 * Runtime: isomorphic
 * Governing contract: ADR 0403 (seven languages: formats per locale); owner principle 2026-10-25 (configuration, not
 *                     code).
 */
import { Enum } from "@stackra/contracts";

import { Locale } from "#core/enums/locale.enum";
import type { LocaleFormat } from "#core/types/locale-format.type";

/**
 * The format of `locale`.
 *
 * @example
 * localeFormat(Locale.De); // { weekStart: 1, hourCycle: "h23" }
 * localeFormat(Locale.En, { hourCycle: HourCycle.H23 }); // { weekStart: 1, hourCycle: "h23" }
 */
export function localeFormat(locale: Locale, override: Partial<LocaleFormat> = {}): LocaleFormat {
  const { weekStart, hourCycle } = Enum.meta(Locale, locale);
  return {
    weekStart: override.weekStart ?? weekStart,
    hourCycle: override.hourCycle ?? hourCycle,
  };
}
