/**
 * Stackra file contract:
 * Purpose: unit tests of `bucketByKey`: a registered key finds its class, an unknown key finds nothing, and `null`
 *          finds the only registered bucket and nothing when there are none or several.
 * Boundary: test only; the process-wide registry is cleared after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 20 and 22).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { bucketByKey } from "#core/functions/bucket-by-key.function";
import { registerBuckets } from "#core/functions/register-buckets.function";

const OPTIONS = { visibility: BucketVisibility.Public, maxBytes: 1, accept: [MediaType.Png] };

class ProductImagesBucket extends Bucket(OPTIONS) {}

class AvatarsBucket extends Bucket(OPTIONS) {}

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("bucketByKey", () => {
  it("finds a registered bucket by key", () => {
    registerBuckets([
      { type: ProductImagesBucket, key: "catalogue.product_images" },
      { type: AvatarsBucket, key: "identity.avatars" },
    ]);
    expect(bucketByKey("identity.avatars")).toBe(AvatarsBucket);
    expect(bucketByKey("billing.invoices")).toBeUndefined();
  });

  it("finds the only bucket for null", () => {
    expect(bucketByKey(null)).toBeUndefined();
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
    expect(bucketByKey(null)).toBe(ProductImagesBucket);
    registerBuckets([{ type: AvatarsBucket, key: "identity.avatars" }]);
    expect(bucketByKey(null)).toBeUndefined();
  });

  it("never finds an unregistered class by its derived key", () => {
    expect(bucketByKey("product_images")).toBeUndefined();
  });
});
