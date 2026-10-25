/**
 * Stackra file contract:
 * Purpose: `useMail()`, the hook a `.mail.tsx` body reads the recipient's helpers with: `mail = useMail()` as a class
 *          component field, then `this.mail.t(key, values)`, `this.mail.money(minor, currency)`,
 *          `this.mail.asset(entry)`, `this.mail.locale` and `this.mail.dir`.
 * Boundary: reads the context the mail renderer provides; throws outside a mail render, so a body never falls back to
 *           a silent default locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0223; ADR 0305 (class components: a hook field is read-only); ADR 0080.
 */
import { use } from "react";

import { MailContext } from "#react/mail/mail-context";
import type { MailTools } from "#react/mail/mail-tools.type";

/**
 * The helpers of the recipient of the mail being rendered.
 *
 * @throws Error outside a mail render (`renderMail` in tests, the Notifier's renderer at send time).
 * @example
 * export class OrderReceiptMail extends Component<MailProps<typeof OrderReceiptNotification>> {
 *   mail = useMail();
 *
 *   render() {
 *     const { t, locale, dir } = this.mail;
 *     return <Html lang={locale} dir={dir}><Text>{t(I18n.orders.order_receipt.mail.intro)}</Text></Html>;
 *   }
 * }
 */
export function useMail(): MailTools {
  const tools = use(MailContext);
  if (tools === null)
    throw new Error(
      "useMail() runs only inside a mail render (renderMail, or the Notifier's renderer)",
    );
  return tools;
}
