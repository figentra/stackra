/**
 * Stackra file contract:
 * Purpose: `renderMailBody(body, data, options)`, the mail renderer: the compiled `.mail.tsx` body rendered with the
 *          recipient's `MailTools` to an HTML document and its plain-text part.
 * Boundary: internal (`renderMail` in `./testing` and the sending Notifier driver call it). Synchronous static markup
 *           through `react-dom/server`; no template engine at run time (R-26), no container and no I/O: catalogues and
 *           the asset resolver arrive in `options`. Money uses the currency's ISO 4217 exponent, never rounded.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (as amended by ADR 0294: `.mail.tsx` bodies); ADR 0080; ADR 0192; ADR 0220.
 */
import { NumberingSystem, formatMessage } from "@stackra/i18n";
import { Money } from "@stackra/money";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { htmlToText } from "@stackra/support";

import type { MailBody } from "#react/mail/mail-body.type";
import { MailContext } from "#react/mail/mail-context";
import type { MailRenderOptions } from "#react/mail/mail-render-options.type";
import type { MailTools } from "#react/mail/mail-tools.type";
import type { RenderedMail } from "#react/mail/rendered-mail.type";

/** The doctype mail clients render most consistently, the one React Email writes. */
const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

/** The recipient's helpers for one render. */
function toolsFor({ locale, messages, i18n, asset }: MailRenderOptions): MailTools {
  const intlLocale =
    i18n.numerals === NumberingSystem.User ? locale : `${locale}-u-nu-${i18n.numerals}`;
  return Object.freeze({
    locale,
    dir: i18n.rtl.includes(locale) ? "rtl" : "ltr",
    t: (key, values) => formatMessage(messages, key, values, intlLocale),
    money: (minor, currency) => {
      const decimal = Money.ofMinor(minor, currency).toDecimal();
      const digits = decimal.split(".")[1]?.length ?? 0;
      // shortcut: Number() keeps 15 significant digits, exact for any realistic amount; pass the decimal string once
      // every target runtime's Intl.NumberFormat accepts one (ES2023).
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(Number(decimal));
    },
    asset,
  } satisfies MailTools);
}

/**
 * The mail `body` rendered with `data` for one recipient.
 *
 * @throws RangeError when the body translates a key the catalogues lack, or formats an invalid amount.
 * @example
 * const { html, text } = renderMailBody(OrderReceiptMail, data, { locale: Locale.Ar, messages, i18n, asset });
 */
export function renderMailBody<P extends object>(
  body: MailBody<P>,
  data: P,
  options: MailRenderOptions,
): RenderedMail {
  const Body = body as ComponentType<P>;
  const html =
    DOCTYPE +
    renderToStaticMarkup(
      <MailContext value={toolsFor(options)}>
        <Body {...data} />
      </MailContext>,
    );
  return { html, text: htmlToText(html) };
}
