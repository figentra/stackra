/**
 * Stackra file contract:
 * Purpose: `MailTools`, what `useMail()` returns to a mail body: translation, money formatting and asset URLs in the
 *          recipient's locale, the locale and its direction for `<Html lang dir>`, and `richText` for tenant or client
 *          rich-text HTML, sanitized.
 * Boundary: type only; every member is safe to destructure (`const { t, money, locale, dir } = this.mail`). `richText`
 *           is the only way a mail body puts HTML it did not write into a mail (`react/no-danger` holds in `*.mail.tsx`).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (i18n keys), ADR 0192 (digits), ADR 0220 (money in minor units), ADR 0234 (assets by
 *                     key), ADR 0305 (class components: hooks as fields); STA-2582 (`sanitizeHtml` on mailed HTML).
 */
import type { AssetEntry } from "@stackra/assets";
import type { HtmlPolicy } from "@stackra/csp";
import type { I18nKey, Locale } from "@stackra/i18n";
import type { ReactElement } from "react";

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

  /**
   * Tenant or client rich-text `html` (a branch's welcome note, an editor's message) as a `<div>` holding only what
   * `sanitizeHtml` keeps under `policy`: no script, style, event handler, `style` attribute or non-http(s)/mailto
   * link. `policy` narrows the rich-text default (`RICH_TEXT_HTML_POLICY`); `sanitizeHtml`'s floor holds under any.
   */
  readonly richText: (html: string, policy?: HtmlPolicy) => ReactElement;
}
