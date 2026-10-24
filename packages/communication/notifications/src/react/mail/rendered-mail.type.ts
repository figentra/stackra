/**
 * Stackra file contract:
 * Purpose: `RenderedMail`, a mail body rendered for one recipient: the HTML document and its plain-text part.
 * Boundary: type only; the subject is rendered separately from the notification's `MailMessage`.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (mail bodies are rendered to HTML and text).
 */

/** One rendered mail body. */
export interface RenderedMail {
  /** The HTML document, with an XHTML doctype for mail clients. */
  readonly html: string;

  /** The plain-text part derived from the HTML. */
  readonly text: string;
}
