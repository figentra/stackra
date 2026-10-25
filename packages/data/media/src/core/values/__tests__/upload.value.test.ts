/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Upload`: the wire schema takes `{ id: "upl_…" }`, drops other keys and refuses a
 *          malformed id; the type names its bucket and a plain `{ id }` fits it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 2); ADR 0294 (decision 26).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Bucket } from "#core/bases/bucket.base";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { Upload } from "#core/values/upload.value";

class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 5_000_000,
  accept: [MediaType.Png],
}) {}

const ID = "upl_01jb3m0000000000000000000a";

describe("Upload", () => {
  it("parses a token and drops other keys", () => {
    expect(Upload.schema.parse({ id: ID, url: "https://cdn.test/x.png" })).toEqual({ id: ID });
  });

  it.each(["", "upl_short", "prd_01jb3m0000000000000000000a", "upl_../../public/x.png0000000"])(
    "refuses the id %j",
    (id) => {
      expect(Upload.schema.safeParse({ id }).success).toBe(false);
    },
  );

  it("is frozen", () => {
    expect(Object.isFrozen(Upload)).toBe(true);
  });

  it("names its bucket in the type only", () => {
    const token: Upload<ProductImagesBucket> = { id: ID };
    expect(Object.keys(token)).toEqual(["id"]);
    expectTypeOf<Upload<ProductImagesBucket>["id"]>().toEqualTypeOf<PublicId<"upl">>();
    expectTypeOf(Upload.schema.parse({ id: ID })).toExtend<Upload>();
  });
});
