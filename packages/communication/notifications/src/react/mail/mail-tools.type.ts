/**
 * Stackra file contract:
 * Purpose: `MailTools`, what `useMail()` returns to a mail body: translation, money formatting and asset URLs in the
 *          recipient's locale, plus the locale and its direction for `<Html lang dir>`.
 * Boundary: type only; every member is safe to destructure (`const { t, money, locale, dir } = this.mail`).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (i18n keys), ADR 0192 (digits), ADR 0220 (money in minor units), ADR 0234 (assets by
 *                     key), ADR 0305 (class components: hooks as fields).
 */
import type { AssetEntry } from "@stackra/assets";
import type { I18nKey, Locale } from "@stackra/i18n";

/** The recipient-side helpers of one mail render. */
export interface MailTools {
  /** The recipient's locale. */
  readonly locale: Locale;

  /** `rtl` when the member's `I18nConfig.rtl` lists the locale, else `ltr`. */
  readonly dir: "ltr" | "rtl";

  /**
   * The message of `key` formatted with `values` (ICU arguments, plurals included).
   *
   * @throws RangeError when the catalogues hold no message for `key`.
   */
  readonly t: (key: I18nKey, values?: Readonly<Record<string, unknown>>) => string;

  /**
   * `minor` units of `currency` in the recipient's locale and digits, with the currency's ISO 4217 exponent.
   *
   * @throws RangeError when `minor` is not a safe integer or `currency` is not an ISO 4217 code with minor units.
   */
  readonly money: (minor: number, currency: string) => string;

  /** The public URL of a module asset (`asset(Assets.orders.public.logo_svg)`). */
  readonly asset: (entry: AssetEntry) => string;
}
