/**
 * Stackra file contract:
 * Purpose: `I18nState`, what `I18nProvider` puts in context for the hooks: the active locale, its catalogues, the
 *          resolved configuration, the Intl tag with the configured digits, and the locale setter.
 * Boundary: type only; internal to the `./react` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0192.
 */
import type { I18nConfig } from "#config/i18n.config";
import type { Locale } from "#core/enums/locale.enum";
import type { Messages } from "#core/types/messages.type";

/** The i18n context of one app root or request. */
export interface I18nState {
  /** The active locale. */
  readonly locale: Locale;

  /** The BCP 47 tag every formatter uses: the locale plus the `-u-nu-` digits extension, if any. */
  readonly intlLocale: string;

  /** The catalogues of the active locale, merged along its fallback chain. */
  readonly messages: Messages;

  /** The resolved i18n configuration from the container. */
  readonly config: I18nConfig;

  /** Switches the active locale; rejects where the URL alone selects it. */
  readonly setLocale: (locale: Locale) => Promise<void>;
}
