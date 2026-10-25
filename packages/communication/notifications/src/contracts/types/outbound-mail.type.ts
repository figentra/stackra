/**
 * Stackra file contract:
 * Purpose: `OutboundMail`, one rendered mail as a `MailTransport` driver sends it: the verified address, the sender,
 *          the subject in the recipient's language, and the HTML and text bodies.
 * Boundary: a type only. The address is resolved at the moment of sending and never stored by the caller (ADR 0134);
 *           the bodies travel in the delivery job's payload only.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (notifications); ADR 0266 (the transport is a port); ADR 0134 (personal data).
 */
import type { Email } from "@stackra/contracts";

/**
 * A mail ready to send.
 *
 * @example
 * const mail: OutboundMail = { to, from: config.fromAddress, subject, html, text };
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
}
