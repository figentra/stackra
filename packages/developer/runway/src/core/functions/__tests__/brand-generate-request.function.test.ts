/**
 * Stackra file contract:
 * Purpose: unit tests of `brandGenerateRequest`: the kit and the captions sit under the default assets root or the one
 *          the root runway names, the output is `.stackra/brand`, and the screenshots folder is passed only when given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decisions 1, 5 and 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { brandGenerateRequest } from "#core/functions/brand-generate-request.function";
import { PRODUCT_ROOT } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { parseRunway } from "#core/functions/parse-runway.function";

describe("brandGenerateRequest", () => {
  it("reads the default assets tree and writes to .stackra/brand", () => {
    expect(brandGenerateRequest(PRODUCT_ROOT)).toEqual({
      kit: "assets/brand",
      store: "assets/store",
      out: ".stackra/brand",
    });
  });

  it("follows the runway's assets root and passes the screenshots", () => {
    const root = parseRunway("root", {
      version: 3,
      project: "mezzora",
      assets: { root: "brand-assets" },
      environments: {},
    });
    expect(brandGenerateRequest(root, { screenshots: ".stackra/screens" })).toEqual({
      kit: "brand-assets/brand",
      store: "brand-assets/store",
      out: ".stackra/brand",
      screenshots: ".stackra/screens",
    });
  });
});
