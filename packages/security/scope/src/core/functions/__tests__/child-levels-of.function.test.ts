/**
 * Stackra file contract:
 * Purpose: unit tests of `childLevelsOf`: the root takes the first level; a node takes the next level, and its own
 *          level too when that level is recursive; the last level takes only itself when recursive; a level added as
 *          data is offered with no code change; with levels that name their `parents`, a parent takes every level that
 *          names it (a unit and a location under a tenant, a unit under a unit, a location never under a location),
 *          the levels with no `parents` keep the chain, and a recursive level nests under itself; a parent at an
 *          undeclared level takes nothing.
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

  describe("with levels that name their parents", () => {
    /** platform › product › tenant (recursive) › unit (recursive) › location, a location under a tenant or a unit. */
    const UNITS: ScopeLevel[] = [
      ...DEFAULTS,
      { key: "tenant", recursive: true },
      { key: "unit", recursive: true, parents: ["tenant", "unit"] },
      { key: "location", recursive: false, parents: ["tenant", "unit"] },
    ];

    it("offers every level that names the parent, with the parent's own when recursive", () => {
      expect(childLevelsOf(UNITS, "tenant")).toEqual(["tenant", "unit", "location"]);
      expect(childLevelsOf(UNITS, "unit")).toEqual(["unit", "location"]);
    });

    it("never nests a level that is not recursive under itself", () => {
      expect(childLevelsOf(UNITS, "location")).toEqual([]);
    });

    it("keeps the chain rule for the levels that name no parents", () => {
      expect(childLevelsOf(UNITS)).toEqual(["platform"]);
      expect(childLevelsOf(UNITS, "platform")).toEqual(["product"]);
      expect(childLevelsOf(UNITS, "product")).toEqual(["tenant"]);
    });

    it("nests a recursive level under itself even when its parents leave it out", () => {
      const levels: ScopeLevel[] = [
        { key: "tenant", recursive: false },
        { key: "unit", recursive: true, parents: ["tenant"] },
      ];
      expect(childLevelsOf(levels, "unit")).toEqual(["unit"]);
      expect(childLevelsOf(levels, "tenant")).toEqual(["unit"]);
    });
  });

  it("gives a parent at an undeclared level nothing", () => {
    expect(childLevelsOf(DEFAULTS, "region")).toEqual([]);
  });
});
