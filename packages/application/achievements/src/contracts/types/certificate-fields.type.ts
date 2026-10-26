/**
 * Stackra file contract:
 * Purpose: `CertificateFields`, the values of one award's certificate that a consumer hands to @stackra/documents with
 *          the kind's certificate template: the kind's name, level, period, grant time, the verify URL, its QR code and the
 *          short code printed beside it.
 * Boundary: a type only. The layout is a studio print template (the kind's `certificateTemplate` key), never code
 *           here; the recipient's display name is the consumer's, which knows its model.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 6); ADR 0432 (decisions 2 and 4); OS ADR 0058 (decision 1: certificates through @stackra/documents).
 */
import type { PublicId } from "@stackra/contracts";

/**
 * A certificate's values.
 *
 * @example
 * const fields = await awards.certificateOf(awardId, settings.verifyBaseUrl);
 */
export interface CertificateFields {
  /** The award's public id. */
  readonly awardId: PublicId<"awd">;

  /** The kind's print template key for @stackra/documents; null when the kind has none. */
  readonly template: string | null;

  /** The kind's display name. */
  readonly kindName: string;

  /** The level granted; null for a kind with no levels. */
  readonly level: string | null;

  /** The period granted for; null for a kind that is not once per period. */
  readonly period: string | null;

  /** When it was granted. */
  readonly grantedAt: Date;

  /** The public URL that verifies the award. */
  readonly verifyUrl: string;

  /** The short verify code a person types instead of scanning; null for an award granted before codes. */
  readonly verifyCode: string | null;

  /** The verify URL as a QR code, an SVG document. */
  readonly verifyQr: string;
}
