/**
 * Stackra file contract:
 * Purpose: `RenderedEmail`, an email template rendered for one recipient: the HTML part and its plain-text part.
 * Boundary: a type only. Sending is the mail driver's (@stackra/mail `Mailer`) or the notifications service's job.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 6 and 12).
 */

/** A rendered email body. */
export interface RenderedEmail {
  /** The whole HTML document. */
  readonly html: string;

  /** The plain-text alternative. */
  readonly text: string;
}
