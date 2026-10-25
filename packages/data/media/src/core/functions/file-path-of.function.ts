/**
 * Stackra file contract:
 * Purpose: `filePathOf`, the stored path of a claimed file: `<visibility>/<bucket key as folders>/<id>.<subtype>`
 *          (`public/catalogue/product_images/upl_01….png`).
 * Boundary: pure apart from reading the bucket's key and options; internal to this package. Every part is made by the
 *           server (a registered key, a checked upload id, an enum media type), so no client text reaches the path.
 *           The visibility prefix is what lets a CDN rule serve `public/` and nothing else.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decisions 1 and 3: key layout, public files from the CDN).
 */
import type { PublicId } from "@stackra/contracts";

import type { MediaType } from "#core/enums/media-type.enum";
import { bucketKeyOf } from "#core/functions/bucket-key-of.function";
import { bucketOptionsOf } from "#core/functions/bucket-options-of.function";
import type { BucketClass } from "#core/types/bucket-class.type";

/**
 * Where the file of upload `id` lives once claimed into `bucket`.
 *
 * @throws TypeError when `bucket` does not extend `Bucket({...})`.
 * @example
 * filePathOf(ProductImagesBucket, "upl_01…", MediaType.Png); // "public/catalogue/product_images/upl_01….png"
 */
export function filePathOf(bucket: BucketClass, id: PublicId<"upl">, mediaType: MediaType): string {
  const { visibility } = bucketOptionsOf(bucket);
  const folders = bucketKeyOf(bucket).replaceAll(".", "/");
  return `${visibility}/${folders}/${id}.${mediaType.slice(mediaType.indexOf("/") + 1)}`;
}
