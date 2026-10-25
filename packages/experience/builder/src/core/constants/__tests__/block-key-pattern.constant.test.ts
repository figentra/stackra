/**
 * Stackra file contract:
 * Purpose: unit test of `BLOCK_KEY_PATTERN`: `<member>.<name>` keys in snake_case pass; single segments, capitals,
 *          spaces and leading digits do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { BLOCK_KEY_PATTERN } from "#core/constants/block-key-pattern.constant";

describe("BLOCK_KEY_PATTERN", () => {
  it("takes dot-separated snake_case keys of two segments or more", () => {
    for (const key of ["web.hero_section", "console.welcome_hero", "a.b.c"])
      expect(BLOCK_KEY_PATTERN.test(key)).toBe(true);
    for (const key of ["hero", "Web.Hero", "web.hero section", "web.1hero", "web."])
      expect(BLOCK_KEY_PATTERN.test(key)).toBe(false);
  });
});
