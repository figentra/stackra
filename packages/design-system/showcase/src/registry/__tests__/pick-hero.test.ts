/**
 * Stackra file contract:
 * Purpose: proves `pickHero` honours an asked-for hero, turns a returning visitor to the next hero, weighs a first
 *          visit's pick and skips heroes outside their dates or weighted 0.
 * Boundary: the pure function with small fixtures.
 * Runtime: node
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { pickHero } from "#src/registry/pick-hero.function";
import type { HeroEntry } from "#src/types/hero-entry.type";

const HEROES: readonly HeroEntry[] = [{ id: "stack" }, { id: "storm" }, { id: "mirror" }];
const NOW = new Date("2026-10-28T12:00:00Z");

describe("pickHero", () => {
  it("shows the hero asked for, even one out of the rotation, and ignores an unknown one", () => {
    const heroes = [...HEROES, { id: "retired", weight: 0 }];
    expect(pickHero({ heroes, now: NOW, random: 0, override: "retired" })).toBe("retired");
    expect(pickHero({ heroes, now: NOW, random: 0, override: "nope" })).toBe("stack");
  });

  it("turns a returning visitor to the next hero, wrapping round", () => {
    expect(pickHero({ heroes: HEROES, now: NOW, random: 0.99, last: "stack" })).toBe("storm");
    expect(pickHero({ heroes: HEROES, now: NOW, random: 0, last: "mirror" })).toBe("stack");
  });

  it("weighs a first visit's pick", () => {
    const heroes = [
      { id: "stack", weight: 1 },
      { id: "storm", weight: 3 },
    ];
    expect(pickHero({ heroes, now: NOW, random: 0.2, last: "gone" })).toBe("stack");
    expect(pickHero({ heroes, now: NOW, random: 0.3 })).toBe("storm");
    expect(pickHero({ heroes, now: NOW, random: 0.999 })).toBe("storm");
  });

  it("skips heroes outside their dates or weighted 0, and picks nothing when none runs", () => {
    const heroes = [
      { id: "later", from: "2026-11-01" },
      { id: "over", until: "2026-10-28" },
      { id: "off", weight: 0 },
      { id: "now", from: "2026-10-28", until: "2026-10-29" },
    ];
    expect(pickHero({ heroes, now: NOW, random: 0 })).toBe("now");
    expect(pickHero({ heroes, now: NOW, random: 0, last: "now" })).toBe("now");
    expect(pickHero({ heroes: [], now: NOW, random: 0 })).toBeUndefined();
  });
});
