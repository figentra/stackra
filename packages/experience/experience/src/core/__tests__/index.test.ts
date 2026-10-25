/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the template imports `Block`, `BlockCategory` and the
 *          `BlockProps` and `LocalizedText` types; the wiring adds `registerBlocks`, and the validator and its two
 *          refusals complete it; nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { BlockEntry, BlockOptions, LocalizedText, ResolvedNode } from "#core/index";

describe("@stackra/experience", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "Block",
      "BlockCategory",
      "InvalidDocumentError",
      "UnknownBlockError",
      "registerBlocks",
      "resolveDocument",
    ]);
  });

  it("exports the types the template, the wiring and the renderers use", () => {
    expectTypeOf<LocalizedText>().toEqualTypeOf<Readonly<Record<string, string>>>();
    expectTypeOf<BlockOptions["category"]>().toEqualTypeOf<core.BlockCategory>();
    expectTypeOf<BlockEntry["key"]>().toEqualTypeOf<string>();
    expectTypeOf<ResolvedNode["path"]>().toEqualTypeOf<string>();
  });
});
