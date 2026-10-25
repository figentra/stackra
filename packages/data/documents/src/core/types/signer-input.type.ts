/**
 * Stackra file contract:
 * Purpose: `SignerInput`, the signer of a form signed on a device: name, time and the drawn signature image.
 * Boundary: a type only. `signForm` places it in the render data under the reserved key `signer`, as `signer.name`,
 *           `signer.signedAt` (ISO 8601) and `signer.image`.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 4).
 */
import type { ImageAsset } from "#core/types/image-asset.type";

/** Who signed a form, and how. */
export interface SignerInput {
  /** The signer's name. */
  readonly name: string;

  /** When they signed. */
  readonly signedAt: Date;

  /** The signature they drew. */
  readonly image: ImageAsset;
}
