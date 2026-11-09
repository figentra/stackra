/**
 * Stackra file contract:
 * Purpose: `DisplaySettings`, how a tenant's dates are shown: `calendar`, Gregorian or the Umm al-Qura Hijri calendar,
 *          which every date formatter follows (the server passes it to `formatDateTime`, an app to `I18nProvider`'s
 *          `calendar`), so a notification, a booking widget and a board all write the same calendar.
 * Boundary: a settings group of this package; its key is `display` and its setting `display.calendar`. Scoped to the
 *           platform's default, a product and a tenant, sent to clients (`client: true`). The value is one of
 *           `@stackra/i18n`'s `CalendarSystem` codes; the default is Gregorian (ADR 0192 decision 3). Never a secret.
 *           It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 3); ADR 0307 (rules 22 to 24); ADR 0294 (decisions 16, 20).
 */
import { Enum } from "@stackra/contracts";
import { CalendarSystem } from "@stackra/i18n";
import { TenancyScopes } from "@stackra/tenancy";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { Setting } from "#core/decorators/setting.decorator";
import { SettingScope } from "#core/enums/setting-scope.enum";

/**
 * How a tenant's dates are shown.
 *
 * @example
 * const { calendar } = await this.settings.get(DisplaySettings);
 * formatDateTime(startsAt, locale, { dateStyle: "full", timeZone }, numerals, calendar);
 */
export class DisplaySettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Product, TenancyScopes.Tenant],
}) {
  /** The calendar dates are written in: Gregorian, or the Umm al-Qura Hijri calendar. */
  @Setting({ client: true })
  calendar: CalendarSystem = CalendarSystem.Gregory;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    DisplaySettings,
    z.object({
      calendar: z.enum(Enum.values(CalendarSystem)).default(CalendarSystem.Gregory),
    }),
  ],
]);
