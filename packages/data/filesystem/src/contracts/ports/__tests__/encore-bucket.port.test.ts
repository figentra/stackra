/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `EncoreBucket` port: a `Port` keyed `filesystem.EncoreBucket` whose method
 *          names and shapes are those of an Encore `Bucket`, so the generated Encore driver forwards each call as is.
 * Boundary: test only; a structural copy of Encore's surface stands in for `encore.dev/storage/objects`, which a
 *           package never imports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0124.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { EncoreBucket } from "#contracts/ports/encore-bucket.port";

describe("EncoreBucket", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(EncoreBucket)).toBe(Port);
  });

  it("carries its port key as a type-only brand", () => {
    expectTypeOf<EncoreBucket["~key"]>().toEqualTypeOf<"filesystem.EncoreBucket">();
  });

  it("has Encore's method shapes", () => {
    expectTypeOf<EncoreBucket["download"]>().returns.toEqualTypeOf<Promise<Uint8Array>>();
    expectTypeOf<EncoreBucket["exists"]>().returns.toEqualTypeOf<Promise<boolean>>();
    expectTypeOf<EncoreBucket["signedUploadUrl"]>().returns.toEqualTypeOf<
      Promise<{ readonly url: string }>
    >();
    expectTypeOf<EncoreBucket["signedDownloadUrl"]>()
      .parameter(1)
      .toEqualTypeOf<{ readonly ttl: number }>();
    expectTypeOf<EncoreBucket["signedDownloadUrl"]>().returns.toEqualTypeOf<
      Promise<{ readonly url: string }>
    >();
    expectTypeOf<EncoreBucket["list"]>().returns.toEqualTypeOf<
      AsyncIterable<{ readonly name: string; readonly size: number }>
    >();
    expectTypeOf<EncoreBucket["publicUrl"]>().returns.toEqualTypeOf<string>();
  });
});
