/**
 * Stackra file contract:
 * Purpose: unit tests of `bucketKeyOf`: the registered key wins; otherwise the class name without `Bucket`, in
 *          snake_case; an unnamed class with no registration is refused.
 * Boundary: test only; the process-wide registry is cleared after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 20).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { bucketKeyOf } from "#core/functions/bucket-key-of.function";

const OPTIONS = { visibility: BucketVisibility.Public, maxBytes: 1, accept: [MediaType.Png] };

class ProductImagesBucket extends Bucket(OPTIONS) {}

class S3ExportsBucket extends Bucket(OPTIONS) {}

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("bucketKeyOf", () => {
  it("derives snake_case from the class name", () => {
    expect(bucketKeyOf(ProductImagesBucket)).toBe("product_images");
    expect(bucketKeyOf(S3ExportsBucket)).toBe("s3_exports");
  });

  it("prefers the registered key", () => {
    BUCKET_REGISTRY.set(ProductImagesBucket, "catalogue.product_images");
    expect(bucketKeyOf(ProductImagesBucket)).toBe("catalogue.product_images");
  });

  it("refuses a class whose name gives no key", () => {
    const anonymous = Bucket(OPTIONS);
    Object.defineProperty(anonymous, "name", { value: "" });
    expect(() => bucketKeyOf(anonymous)).toThrow(/needs a name/);
  });
});
