/**
 * Stackra file contract:
 * Purpose: unit tests of `findShowcaseMisses`, one per acceptance criterion of STA-2738.
 * Boundary: pure; reads and writes nothing.
 * Runtime: node
 * Governing contract: STA-2738 (the `showcase:coverage` script), a child of STA-2705.
 */
import { describe, expect, it } from "vitest";

import type { ComponentEntry } from "../../src/types/component-entry.type.ts";
import { findShowcaseMisses } from "../find-showcase-misses.function.ts";
import type { ShowcaseCoverageInput } from "../showcase-coverage-input.type.ts";

const entry = (over: Partial<ComponentEntry> = {}): ComponentEntry =>
  ({
    slug: "button",
    tier: "free",
    category: "actions",
    platforms: ["react"],
    packageName: "@stackra/ui",
    exportName: "Button",
    parts: ["Button"],
    hero: {},
    examples: [],
    related: [],
    tokens: [],
    keywords: [],
    ...over,
  }) as ComponentEntry;

const catalogue = (slug: string) => ({ component: { free: { [slug]: { title: "Button" } } } });
const EMPTY: ShowcaseCoverageInput = {
  entries: [],
  catalogues: { en: {}, ar: {} },
  routes: new Set(),
  demos: new Set(),
  tests: new Set(),
};

describe("findShowcaseMisses", () => {
  it("returns all five gaps for an entry with nothing", () => {
    const misses = findShowcaseMisses({ ...EMPTY, entries: [entry()] });
    expect(misses).toEqual([{ key: "free/button", gaps: ["route", "demo", "en", "ar", "test"] }]);
  });

  it("returns no miss for a complete entry", () => {
    const misses = findShowcaseMisses({
      entries: [entry()],
      catalogues: { en: catalogue("button"), ar: catalogue("button") },
      routes: new Set(["button"]),
      demos: new Set(["free/button"]),
      tests: new Set(["button"]),
    });
    expect(misses).toEqual([]);
  });

  it("names only the locale whose title is missing", () => {
    const misses = findShowcaseMisses({
      entries: [entry()],
      catalogues: { en: catalogue("button"), ar: {} },
      routes: new Set(["button"]),
      demos: new Set(["free/button"]),
      tests: new Set(["button"]),
    });
    expect(misses).toEqual([{ key: "free/button", gaps: ["ar"] }]);
  });

  it("skips a planned entry and a native-only entry", () => {
    const misses = findShowcaseMisses({
      ...EMPTY,
      entries: [entry({ status: "planned" }), entry({ slug: "sheet", platforms: ["native"] })],
    });
    expect(misses).toEqual([]);
  });

  it("looks for the route pro-<slug> for a pro entry", () => {
    const pro = entry({ slug: "kanban", tier: "pro" });
    const without = findShowcaseMisses({ ...EMPTY, entries: [pro], routes: new Set(["kanban"]) });
    expect(without[0]?.gaps).toContain("route");
    const withRoute = findShowcaseMisses({
      ...EMPTY,
      entries: [pro],
      routes: new Set(["pro-kanban"]),
    });
    expect(withRoute[0]?.gaps).not.toContain("route");
  });
});
