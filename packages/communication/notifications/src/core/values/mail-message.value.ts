/**
 * Stackra file contract:
 * Purpose: `MailMessage`, what a notification's `mail(data, mail)` channel method returns: the subject as an i18n key
 *          with its ICU values, translated per recipient when the mail is rendered.
 * Boundary: a frozen value class built by this package (exported as a type only); `subject` returns a new message.
 *           The subject is always a key (`I18n.orders.order_receipt.mail.subject`), never a literal or a concatenation
 *           (ADR 0080); the body is the notification's `.mail.tsx` class component, bound by name.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (as amended by ADR 0294: one method per channel); ADR 0080 (i18n keys); ADR 0268.
 */
import type { I18nKey } from "@stackra/i18n";

/**
 * The mail channel of one notification.
 *
 * @example
 * mail({ order }: OrderReceiptData, mail: MailMessage): MailMessage {
 *   return mail.subject(I18n.orders.order_receipt.mail.subject, { id: order.id });
 * }
 */
export class MailMessage {
  /** The subject's key; `null` until `subject` is called. */
  readonly subjectKey: I18nKey | null;

  /** The subject's ICU values. */
  readonly subjectValues: Readonly<Record<string, unknown>>;

  /**
   * @param subjectKey - the subject's key; `null` for an empty message.
   * @param subjectValues - the subject's ICU values.
   */
  constructor(
    subjectKey: I18nKey | null = null,
    subjectValues: Readonly<Record<string, unknown>> = {},
  ) {
    this.subjectKey = subjectKey;
    this.subjectValues = Object.freeze({ ...subjectValues });
    Object.freeze(this);
  }

  /** This message with the subject `key`, formatted with `values` in the recipient's locale. */
  subject(key: I18nKey, values: Readonly<Record<string, unknown>> = {}): MailMessage {
    return new MailMessage(key, values);
  }
}
