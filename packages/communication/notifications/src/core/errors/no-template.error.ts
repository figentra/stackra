/**
 * Stackra file contract:
 * Purpose: `NoTemplateError` (`no_template`), the refusal when no template of a notification fits a channel, the
 *          recipient's locale chain and the variant asked for; above all when a restricted record needs a content-free
 *          template and none exists, so the full content is never sent instead.
 * Boundary: kind `FailedPrecondition`, never retryable as it stands. Details are codes only.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 3); row "content-free templates for restricted records"; ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * No template fits.
 *
 * @example
 * throw NoTemplateError.create({ key: "matters.update", channel: "sms", variant: "content_free" });
 */
export class NoTemplateError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The notification's key. */
  key!: string;

  /** The channel. */
  channel!: string;

  /** The variant asked for. */
  variant!: string;
}
