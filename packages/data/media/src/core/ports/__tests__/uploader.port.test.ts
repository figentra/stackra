/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Uploader` port: an abstract `Port` keyed `media.Uploader` whose `upload` takes a
 *          file and a bucket key or `null` and resolves to an `Upload`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0142; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Uploader } from "#core/ports/uploader.port";
import type { Upload } from "#core/values/upload.value";

describe("Uploader", () => {
  it("is a port keyed media.Uploader", () => {
    expect(Uploader.prototype).toBeInstanceOf(Port);
    expectTypeOf<Uploader["~key"]>().toEqualTypeOf<"media.Uploader">();
  });

  it("uploads a blob into a bucket or the only one", () => {
    expectTypeOf<Uploader["upload"]>().toEqualTypeOf<
      (file: Blob, bucket: string | null) => Promise<Upload>
    >();
  });
});
