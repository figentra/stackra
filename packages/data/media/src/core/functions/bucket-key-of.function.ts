/**
 * Stackra file contract:
 * Purpose: `bucketKeyOf`, the key of a bucket class: the one gen registered (`catalogue.product_images`), else the
 *          class name without `Bucket`, in snake_case (`ProductImagesBucket` is `product_images`).
 * Boundary: pure apart from reading the registry. The fallback has no module part, because the module folder is gone at
 *           run time; it lets a test or an ungenerated member work, and a generated key always carries a dot, so the
 *           two never collide.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: identities are derived); ADR 0231 (snake_case keys).
 */
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import type { BucketClass } from "#core/types/bucket-class.type";

/**
 * The key of `type`.
 *
 * @throws TypeError when `type` is unregistered and its name gives no key (an anonymous class, or one named `Bucket`).
 * @example
 * bucketKeyOf(ProductImagesBucket); // "catalogue.product_images" once gen registered it, else "product_images"
 */
export function bucketKeyOf(type: BucketClass): string {
  const registered = BUCKET_REGISTRY.get(type);
  if (registered !== undefined) return registered;
  const stem = type.name.replace(/Bucket$/, "");
  if (stem === "")
    throw new TypeError(
      "A bucket class needs a name, such as ProductImagesBucket, or a registered key",
    );
  return stem.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
