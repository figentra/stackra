/**
 * Stackra file contract:
 * Purpose: unit tests of `bucketOptionsOf`: it returns a bucket's recorded options and refuses the bare kind base and a
 *          class of no kind.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 25).
 */
import { describe, expect, it } from "@stackra/testing";

import type { BucketBase } from "#core/bases/bucket.base";
import { Bucket } from "#core/bases/bucket.base";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { bucketOptionsOf } from "#core/functions/bucket-options-of.function";

class InvoicesBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 100,
  accept: [MediaType.Pdf],
}) {}

describe("bucketOptionsOf", () => {
  it("returns the recorded options", () => {
    expect(bucketOptionsOf(InvoicesBucket)).toEqual({
      visibility: "private",
      maxBytes: 100,
      accept: ["application/pdf"],
      variants: {},
    });
  });

  it("refuses the bare kind base and a plain class", () => {
    expect(() => bucketOptionsOf(Bucket as unknown as typeof BucketBase)).toThrow(
      /does not extend Bucket/,
    );
    class Plain {}
    expect(() => bucketOptionsOf(Plain as never)).toThrow(/Plain does not extend Bucket/);
  });
});
