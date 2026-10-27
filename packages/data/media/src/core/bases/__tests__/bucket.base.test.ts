/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Bucket({...})`: the template's product-images bucket records its frozen options as
 *          kind `bucket`; a broken visibility, size, accept list or variant is refused when the class is defined; a
 *          bare `extends Bucket` does not compile.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 16 and 25); ADR 0305 (rule 2).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Bucket, BucketBase } from "#core/bases/bucket.base";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import type { ImageFormat } from "#core/enums/image-format.enum";
import { MediaType } from "#core/enums/media-type.enum";
import type { BucketOptions } from "#core/types/bucket-options.type";

/** The template's `catalogue.product_images`. */
class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 5_000_000,
  accept: [MediaType.Jpeg, MediaType.Png, MediaType.Webp],
  variants: {
    card: { width: 600 },
    zoom: { width: 1_600 },
  },
}) {}

/** A bucket with `options` over valid defaults. */
const define = (options: Partial<BucketOptions>) =>
  Bucket({
    visibility: BucketVisibility.Private,
    maxBytes: 1,
    accept: [MediaType.Pdf],
    ...options,
  } as BucketOptions);

describe("Bucket", () => {
  it("records the template bucket's options as kind bucket", () => {
    expect(kindOf(ProductImagesBucket)).toEqual({
      kind: "bucket",
      options: {
        visibility: "public",
        maxBytes: 5_000_000,
        accept: ["image/jpeg", "image/png", "image/webp"],
        variants: { card: { width: 600 }, zoom: { width: 1_600 } },
      },
    });
    expect(new ProductImagesBucket()).toBeInstanceOf(BucketBase);
  });

  it("freezes what it records", () => {
    const options = kindOf(ProductImagesBucket)?.options as unknown as BucketOptions;
    expect(Object.isFrozen(options)).toBe(true);
    expect(Object.isFrozen(options.accept)).toBe(true);
    expect(Object.isFrozen(options.variants?.["card"])).toBe(true);
  });

  it("records no variants as an empty set", () => {
    expect(kindOf(define({}))?.options["variants"]).toEqual({});
  });

  it("refuses an unknown visibility", () => {
    expect(() => define({ visibility: "world" as never })).toThrow(/visibility/);
  });

  it.each([0, -1, 2.5, Number.NaN])("refuses maxBytes %s", (maxBytes) => {
    expect(() => define({ maxBytes })).toThrow(/maxBytes/);
  });

  it("refuses an empty or unknown accept list", () => {
    expect(() => define({ accept: [] })).toThrow(/accept/);
    expect(() => define({ accept: ["image/svg+xml" as never] })).toThrow(/accept/);
  });

  it("refuses a variant with a bad name, box or format", () => {
    expect(() => define({ variants: { Card: { width: 1 } } })).toThrow(/snake_case/);
    expect(() => define({ variants: { card: { width: 0 } } })).toThrow(/card.*width/);
    expect(() => define({ variants: { card: { width: 1, height: 1.5 } } })).toThrow(/height/);
    expect(() =>
      define({ variants: { card: { width: 1, format: "tiff" as ImageFormat } } }),
    ).toThrow(/format/);
  });

  it("is called only", () => {
    expectTypeOf(Bucket).parameter(0).toEqualTypeOf<BucketOptions>();
    // @ts-expect-error a bucket declares its options
    class Bare extends Bucket {}
    expect(Bare).toBeDefined();
  });
});
