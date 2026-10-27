/**
 * Stackra file contract:
 * Purpose: `RestrictedFieldError` (`restricted_field`), the refusal of a content-free template that reads a field
 *          other than the record's kind and link, so a restricted record's content never reaches a message.
 * Boundary: kind `FailedPrecondition`, never retryable as it stands: the template must be fixed. Details are codes
 *           only (the template key, channel, part and field name), never the template's text.
 * Runtime: isomorphic
 * Governing contract: row "content-free templates for restricted records"; ADR 0140; ADR 0328; STA-964.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A content-free template reads a restricted field.
 *
 * @example
 * throw RestrictedFieldError.create({ key: "matters.update", channel: "sms", part: "body", field: "client_name" });
 */
export class RestrictedFieldError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The notification's key. */
  key!: string;

  /** The template's channel. */
  channel!: string;

  /** The content part that reads the field (`subject`, `body`, `title`). */
  part!: string;

  /** The field it reads. */
  field!: string;
}
