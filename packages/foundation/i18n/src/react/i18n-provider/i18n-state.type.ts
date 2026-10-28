/**
 * Stackra file contract:
 * Purpose: `I18nState`, what `I18nProvider` puts in context for the hooks: the active locale, its catalogues, the
 *          resolved configuration, the locale's week start and clock, the Intl tag with the configured clock and
 *          digits, the zone dates are shown in, and the locale
 *          setter.
 * Boundary: type only; internal to the `./react` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0192.
 */
import type { I18nConfig } from "#config/i18n.config";
import type { Locale } from "#core/enums/locale.enum";
import type { LocaleFormat } from "#core/types/locale-format.type";
import type { Messages } from "#core/types/messages.type";

/** The i18n context of one app root or request. */
export interface I18nState {
  /** The active locale. */
  readonly locale: Locale;

  /** The BCP 47 tag every formatter uses: the locale plus the `-u-` clock (`hc`) and digits (`nu`) extension. */
  readonly intlLocale: string;

  /** The active locale's week start and clock: its defaults with the configured override (a date picker reads it). */
  readonly format: LocaleFormat;

  /** The IANA zone dates are shown in (a native app's `region`); `null` is the runtime's zone. */
  readonly timeZone: string | null;

  /** The catalogues of the active locale, merged along its fallback chain. */
  readonly messages: Messages;

  /** The resolved i18n configuration from the container. */
  readonly config: I18nConfig;

  /** Switches the active locale; rejects where the URL alone selects it. */
  readonly setLocale: (locale: Locale) => Promise<void>;
}
