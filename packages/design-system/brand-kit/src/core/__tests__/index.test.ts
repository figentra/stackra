/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly its values are exported (the kit schema and defaults, the
 *          parser, the check, the planner and its parts, the schema checker and the error), nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as brandKit from "#core/index";

describe("@stackra/brand-kit", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(brandKit).sort()).toEqual([
      "BRAND_KIT_SCHEMA",
      "InvalidKitError",
      "KIT_DEFAULTS",
      "checkKit",
      "icoOf",
      "iconSvg",
      "parseKit",
      "pathData",
      "planBrand",
      "pngSize",
      "storeFrameSvg",
      "symbolOf",
      "validateJsonSchema",
      "webManifest",
    ]);
  });
});
