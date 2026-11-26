/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `BrandAssetsBucket` and `BrandReader` are its values, and
 *          nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

/** The `./node` entry. */
describe("@stackra/branding/node", () => {
  /** Exactly these values. */
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual(["BrandAssetsBucket", "BrandReader"]);
  });
});
