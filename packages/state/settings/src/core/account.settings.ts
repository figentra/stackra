/**
 * Stackra file contract:
 * Purpose: `AccountSettings`, a person's own account preferences kept on the server: `locale`, the language they chose
 *          in an app, so emails, notifications, the web and every other device write to them in it (STA-1534).
 * Boundary: a settings group of this package; its key is `account` and its setting `account.locale`. Scoped to the
 *           platform's default and the user's own holder only, sent to clients (`client: true`) and always live (a
 *           user's own preference, ADR 0395). `null`, the default, means no choice: a native app follows the phone
 *           and the web negotiates. The value is one of `@stackra/i18n`'s locale codes; the app's `I18nConfig.locales`
 *           narrows what it offers. The server's `IdentityResolver` reads it over the identity provider's language
 *           for `VerifiedPrincipal.locale`. Never a secret. It registers its schema when the module loads (STA-339
 *           replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note); ADR 0307 (rules 22 to 24); ADR 0108; ADR 0294 (decisions 16, 20).
 */
import { Enum } from "@stackra/contracts";
import { Locale } from "@stackra/i18n";
import { registerSchemas, Str } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { Setting } from "#core/decorators/setting.decorator";
import { SettingScope } from "#core/enums/setting-scope.enum";

/**
 * A person's own account preferences.
 *
 * @example
 * const { locale } = await this.settings.get(AccountSettings, { user: principal.id });
 * await store.write("account", { user: principal.id }, { locale: "ar" });
 */
export class AccountSettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.User],
}) {
  /** The language the person chose, a locale code (`ar`); `null` follows the phone or the browser. */
  @Str
  @Setting({
    client: true,
    live: true,
  })
  locale: Locale | null = null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [AccountSettings, z.object({ locale: z.enum(Enum.values(Locale)).nullable().default(null) })],
]);
