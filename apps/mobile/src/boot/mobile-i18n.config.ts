/**
 * Stackra file contract:
 * Purpose: `MobileI18nConfig`, this app's override of @stackra/i18n's configuration: it ships English and Arabic, and
 *          the phone owns the language choice (`nativeSwitcher` stays `system`).
 * Boundary: `override` members only, inheriting the key (`i18n`); bound in the app's container in place of `I18nConfig`.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note); ADR 0192 (RTL); ADR 0007 (documentation).
 */
import { I18nConfig, Locale } from "@stackra/i18n";

/** The app's languages: English and Arabic, chosen on the phone. */
export class MobileI18nConfig extends I18nConfig {
  /** The languages the app ships, the default first. */
  override locales: Locale[] = [Locale.En, Locale.Ar];
}
