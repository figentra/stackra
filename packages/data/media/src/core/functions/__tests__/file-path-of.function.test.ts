/**
 * Stackra file contract:
 * Purpose: unit tests of `filePathOf`: `<visibility>/<key as folders>/<id>.<subtype>`, with the registered key's dots
 *          as folders and the derived key otherwise.
 * Boundary: test only; the process-wide registry is cleared after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decisions 1 and 3).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { filePathOf } from "#core/functions/file-path-of.function";
import { registerBuckets } from "#core/functions/register-buckets.function";

class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 1,
  accept: [MediaType.Jpeg],
}) {}

class InvoicesBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 1,
  accept: [MediaType.Pdf],
}) {}

const ID = "upl_01jb3m0000000000000000000a";

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("filePathOf", () => {
  it("puts a public file under public/ with its subtype as extension", () => {
    expect(filePathOf(ProductImagesBucket, ID, MediaType.Jpeg)).toBe(
      `public/product_images/${ID}.jpeg`,
    );
  });

  it("turns a registered key's dots into folders", () => {
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
    expect(filePathOf(ProductImagesBucket, ID, MediaType.Jpeg)).toBe(
      `public/catalogue/product_images/${ID}.jpeg`,
    );
  });

  it("puts a private file under private/", () => {
    expect(filePathOf(InvoicesBucket, ID, MediaType.Pdf)).toBe(`private/invoices/${ID}.pdf`);
  });
});
