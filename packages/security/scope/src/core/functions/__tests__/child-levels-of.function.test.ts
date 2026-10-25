/**
 * Stackra file contract:
 * Purpose: unit tests of `childLevelsOf`: the root takes the first level; a node takes the next level, and its own
 *          level too when that level is recursive; the last level takes only itself when recursive; a level added as
 *          data is offered with no code change; a parent at an undeclared level takes nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { ScopeLevel } from "#contracts/index";
import { childLevelsOf } from "#core/functions/child-levels-of.function";

const DEFAULTS: ScopeLevel[] = [
  { key: "platform", recursive: false },
  { key: "product", recursive: false },
];

describe(childLevelsOf, () => {
  it("gives the root the first level", () => {
    expect(childLevelsOf(DEFAULTS)).toEqual(["platform"]);
    expect(childLevelsOf([])).toEqual([]);
  });

  it("gives a node the next level, and the last level nothing", () => {
    expect(childLevelsOf(DEFAULTS, "platform")).toEqual(["product"]);
    expect(childLevelsOf(DEFAULTS, "product")).toEqual([]);
  });

  it("offers a level added as data, nesting it when it is recursive", () => {
    const levels = [
      ...DEFAULTS,
      { key: "store", recursive: true },
      { key: "till", recursive: false },
    ];
    expect(childLevelsOf(levels, "product")).toEqual(["store"]);
    expect(childLevelsOf(levels, "store")).toEqual(["store", "till"]);
    expect(childLevelsOf(levels, "till")).toEqual([]);
  });

  it("gives a parent at an undeclared level nothing", () => {
    expect(childLevelsOf(DEFAULTS, "region")).toEqual([]);
  });
});
