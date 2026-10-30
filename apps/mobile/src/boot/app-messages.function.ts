/**
 * Stackra file contract:
 * Purpose: `appMessages(locale)`, the catalogues the app's screens read in `locale`: the showcase's own (`MESSAGES`:
 *          the app's namespaces, @stackra/ui's `ui` and @stackra/showcase's `showcase`) and the share inbox's
 *          `native_share` strings, in Arabic or English, the two languages the app ships.
 * Boundary: static imports of the packages' `assets/lang` JSON, so Metro bundles both locales; any locale other than
 *           Arabic reads English.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note); ADR 0268 (R15); ADR 0007 (documentation).
 */
import { Locale } from "@stackra/i18n";
import type { Messages } from "@stackra/i18n";
import nativeShareAr from "@stackra/native-share/assets/lang/ar/native_share.json";
import nativeShareEn from "@stackra/native-share/assets/lang/en/native_share.json";

import { MESSAGES as SHOWCASE } from "../constants/messages.constant";

/** The English and Arabic catalogues, built once. */
const MESSAGES: Readonly<Record<"en" | "ar", Messages>> = {
  en: { ...SHOWCASE.en, native_share: nativeShareEn },
  ar: { ...SHOWCASE.ar, native_share: nativeShareAr },
};

/**
 * The app's catalogues in `locale`.
 *
 * @example
 * <I18nProvider locale={locale} messages={appMessages(locale)} ...>
 */
// shortcut: two locales and one namespace by hand until gen writes `loadMessages(locale)` (STA-339).
export function appMessages(locale: Locale): Messages {
  return locale === Locale.Ar ? MESSAGES.ar : MESSAGES.en;
}
