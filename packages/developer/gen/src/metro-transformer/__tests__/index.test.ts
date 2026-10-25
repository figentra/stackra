/**
 * Stackra file contract:
 * Purpose: the contract of the `./metro-transformer` tool hook: the fixed shape Metro loads (`transform` and
 *          `getCacheKey`), and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#metro-transformer` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as hook from "#metro-transformer/index";

describe("@stackra/gen/metro-transformer", () => {
  it("has the shape Metro loads", () => {
    expect(Object.keys(hook).sort()).toEqual(["getCacheKey", "transform"]);
    expect(typeof hook.transform).toBe("function");
  });
});
