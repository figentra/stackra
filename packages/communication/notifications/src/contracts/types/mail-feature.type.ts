/**
 * Stackra file contract:
 * Purpose: `MailFeature`, each optional part of an `OutboundMail` a provider may not carry: `attachments` (by bytes),
 *          `attachmentRefs` (by storage reference), `inline` (attachments with a content id), `cc`, `bcc`, `replyTo`
 *          and `headers`.
 * Boundary: a type only. A `MailSender` that lists `supports` names the ones it carries; the `connection` transport
 *           refuses a mail that uses any other one before anything is sent (`MailFeatureUnsupportedError`).
 * Runtime: isomorphic
 * Governing contract: ADR 0223; ADR 0356; stackra-218 (STA-1376).
 */

/** An optional part of a mail a provider may not carry. */
export type MailFeature =
  | "attachments"
  | "attachmentRefs"
  | "inline"
  | "cc"
  | "bcc"
  | "replyTo"
  | "headers";
