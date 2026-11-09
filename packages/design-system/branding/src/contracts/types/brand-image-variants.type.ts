/**
 * Stackra file contract:
 * Purpose: `BrandImageVariants<T>`, the three sizes every brand image is served in: `print` (documents), `email` and
 *          `mark` (the square icon), each a `T`.
 * Boundary: a type in the leaf entry. `T` is the resized image a surface uses (`ImageVariant`, the default) or the box
 *           the bucket declares (`ImageVariantOptions`). A type alias, not an interface, so it fits the bucket's
 *           `variants` record.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants); ADR 0294 (as amended by programming model v3.1, AGENTS.md;
 *                     rule R8); STA-2644.
 */
import type { ImageVariant } from "@stackra/media";

/**
 * One `T` per brand image size.
 *
 * @example
 * <img src={profile.logo?.variants.email.url} width={profile.logo?.variants.email.width} />
 */
export type BrandImageVariants<T = ImageVariant> = {
  /** At most 600 px wide, for printed documents. */
  readonly print: T;

  /** At most 400 px wide, for email. */
  readonly email: T;

  /** 512 × 512 px, the square mark. */
  readonly mark: T;
};
