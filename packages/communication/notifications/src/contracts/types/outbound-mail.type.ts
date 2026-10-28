/**
 * Stackra file contract:
 * Purpose: `OutboundMail`, one rendered mail as a `MailTransport` driver sends it: the verified address, the sender,
 *          the subject in the recipient's language, the HTML and text bodies, and the optional copies (`cc`, `bcc`),
 *          reply address, extra headers (`List-Unsubscribe`) and attachments.
 * Boundary: a type only. The addresses are resolved at the moment of sending and never stored by the caller (ADR 0134);
 *           the bodies travel in the delivery job's payload only. A header name or value never holds a line break
 *           (the `connection` transport refuses one); an attachment travels by bytes or by storage reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (notifications); ADR 0266 (the transport is a port); ADR 0134 (personal data);
 *                     stackra-218 (STA-1376); RFC 8058.
 */
import type { Email } from "@stackra/contracts";

import type { MailAttachment } from "#contracts/types/mail-attachment.type";

/**
 * A mail ready to send.
 *
 * @example
 * const mail: OutboundMail = { to, from: config.fromAddress, subject, html, text, attachments: [invoicePdf] };
 * const providerId = await transport.send(mail, message.commandKey);
 */
export interface OutboundMail {
  /** The recipient's verified address, read from the identity provider at send time. */
  readonly to: Email;

  /** The sender address. */
  readonly from: Email;

  /** The subject line, already translated. */
  readonly subject: string;

  /** The HTML body, rendered from the `.mail.tsx` class component. */
  readonly html: string;

  /** The plain-text body derived from the HTML. */
  readonly text: string;

  /** The addresses that receive a visible copy. */
  readonly cc?: readonly Email[];

  /** The addresses that receive a hidden copy. */
  readonly bcc?: readonly Email[];

  /** Where a reply goes, when not to `from`. */
  readonly replyTo?: Email;

  /** Extra headers by name (`List-Unsubscribe`, `List-Unsubscribe-Post`). */
  readonly headers?: Readonly<Record<string, string>>;

  /** The attached and inline files. */
  readonly attachments?: readonly MailAttachment[];
}
