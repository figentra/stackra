/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports the `MediaDisk` port (the template's wiring
 *          names it as a driver port, keyed `media.MediaDisk`) and nothing else at run time, and its types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { MediaDisk, MediaObject, SignedUpload, UploadRequest } from "#contracts/index";

describe("@stackra/media/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["MediaDisk"]);
    expect(contracts.MediaDisk.prototype).toBeInstanceOf(Port);
  });

  it("resolves its types", () => {
    expectTypeOf<MediaDisk["~key"]>().toEqualTypeOf<"media.MediaDisk">();
    expectTypeOf<SignedUpload["method"]>().toEqualTypeOf<"PUT">();
    expectTypeOf<MediaObject["contentType"]>().toEqualTypeOf<string | null>();
    expectTypeOf<UploadRequest["metadata"]>().toEqualTypeOf<Readonly<Record<string, string>>>();
  });
});
