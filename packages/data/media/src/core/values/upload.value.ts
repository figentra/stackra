/**
 * Stackra file contract:
 * Purpose: `Upload<B>`, the token of a file a client already put to a signed URL of bucket `B`: what an action input
 *          takes instead of bytes (`image!: Upload<ProductImagesBucket>`), and `Upload.schema`, the wire schema gen
 *          writes for such a field (`image: Upload.schema`).
 * Boundary: a type and a frozen object of the same name, as `Enum.of` declares an enum. The token carries the upload
 *           id only: which bucket, media type and expiry it was signed for are stored with the object, so a client
 *           cannot change them. `B` is type-only documentation of the bucket; `MediaLibrary.claim` checks the bucket
 *           at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: services never stream the bytes); ADR 0294 (decision 26: a package ships
 *                     its own schema); ADR 0095 as amended.
 */
import type { PublicId } from "@stackra/contracts";
import { publicId } from "@stackra/validation";
import { z } from "zod";

import type { BucketBase } from "#core/bases/bucket-base.base";

/** A finished upload, by id. */
export type Upload<B extends BucketBase = BucketBase> = {
  /** The upload's public id (`upl_…`). */
  readonly id: PublicId<"upl">;

  /** Type-only: the bucket the upload was signed for. Never present at run time. */
  readonly "~bucket"?: B;
};

/**
 * The wire schema of an upload token.
 *
 * @example
 * // generated client
 * input: z.object({ productId: publicId("prd"), image: Upload.schema, alt: z.string().nullable() })
 */
export const Upload = Object.freeze({
  /** `{ id: "upl_…" }`; unknown keys are dropped. */
  schema: z.object({ id: publicId("upl") }),
});
