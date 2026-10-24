/**
 * Stackra file contract:
 * Purpose: unit tests of `BucketVisibility`: exactly `public` and `private`, the two path prefixes of stored files.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BucketVisibility } from "#core/enums/bucket-visibility.enum";

describe("BucketVisibility", () => {
  it("is public or private", () => {
    expect(Enum.values(BucketVisibility)).toEqual(["public", "private"]);
    expectTypeOf<BucketVisibility>().toEqualTypeOf<"public" | "private">();
  });
});
