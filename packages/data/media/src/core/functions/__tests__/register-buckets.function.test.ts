/**
 * Stackra file contract:
 * Purpose: unit tests of `registerBuckets`: a row sets the key `bucketKeyOf` returns, a later row for the same class
 *          replaces it, and a non-bucket class, a malformed key or one key for two classes is refused.
 * Boundary: test only; the process-wide registry is cleared after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 20 and 22).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { bucketKeyOf } from "#core/functions/bucket-key-of.function";
import { registerBuckets } from "#core/functions/register-buckets.function";

const OPTIONS = { visibility: BucketVisibility.Public, maxBytes: 1, accept: [MediaType.Png] };

class ProductImagesBucket extends Bucket(OPTIONS) {}

class AvatarsBucket extends Bucket(OPTIONS) {}

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("registerBuckets", () => {
  it("sets the key of each class, a later row winning", () => {
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.images" }]);
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
    expect(bucketKeyOf(ProductImagesBucket)).toBe("catalogue.product_images");
  });

  it("refuses a class that is not a bucket", () => {
    class Plain {}
    expect(() => registerBuckets([{ type: Plain as never, key: "catalogue.plain" }])).toThrow(
      /does not extend Bucket/,
    );
  });

  it.each(["", "Catalogue.Images", "catalogue..images", "catalogue/images", "1st.images"])(
    "refuses the key %j",
    (key) => {
      expect(() => registerBuckets([{ type: ProductImagesBucket, key }])).toThrow(/needs a key/);
    },
  );

  it("refuses one key for two classes", () => {
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.images" }]);
    expect(() => registerBuckets([{ type: AvatarsBucket, key: "catalogue.images" }])).toThrow(
      /both claim/,
    );
  });
});
