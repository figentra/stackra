/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry (`ImageLayer` on `ImageTransform`): it exports the
 *          scanner, transformer, extractor and content-credentials ports and `ScanVerdict`, no `MediaDisk` (folded into
 *          `FileSystem`, ADR 0465), nothing else at run time, and its types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { ImageLayer, ImageTransform } from "#contracts/index";

describe("@stackra/media/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ContentCredentials",
      "FileScanner",
      "ImageTransformer",
      "ScanVerdict",
      "TextExtractor",
    ]);
    expect(contracts.FileScanner.prototype).toBeInstanceOf(Port);
  });

  it("resolves its types", () => {
    expectTypeOf<ImageTransform["layers"]>().toEqualTypeOf<readonly ImageLayer[] | undefined>();
  });
});
