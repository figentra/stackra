/**
 * Stackra file contract:
 * Purpose: `MailFeatureUnsupportedError` (`mail_feature_unsupported`), the refusal when a mail uses a part (an
 *          attachment, cc, bcc, a reply address or extra headers) its chosen provider does not carry, so the mail is
 *          never sent without it.
 * Boundary: kind `FailedPrecondition`, never retryable as it stands. Details are codes only: the provider code and
 *           the `MailFeature`s it lacks, never an address or a file name.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0328; stackra-218 (STA-1376).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The provider cannot carry part of the mail.
 *
 * @example
 * throw MailFeatureUnsupportedError.create({ provider: "resend", features: ["attachmentRefs"] });
 */
export class MailFeatureUnsupportedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The provider's code, when the driver map names it. */
  provider?: string;

  /** The parts of the mail the provider does not carry. */
  features!: readonly string[];
}
