/**
 * Stackra file contract:
 * Purpose: the derived values of the registry: web paths both ways, category paths both ways, import lines, catalogue
 *          keys, listing order, neighbours and the mobile route.
 * Boundary: pure functions over the real registry and small fixtures.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) sections 2.1 and 2.2.
 */
import { describe, expect, it } from "vitest";

import { ComponentCategory } from "#src/enums/component-category.enum";
import { byCategory } from "#src/registry/by-category.function";
import { bySlug } from "#src/registry/by-slug.function";
import { byWebPath } from "#src/registry/by-web-path.function";
import { categoryFromSegment } from "#src/registry/category-from-segment.function";
import { categoryPath } from "#src/registry/category-path.function";
import { componentKeys } from "#src/registry/component-keys.function";
import { COMPONENTS } from "#src/registry/components.generated";
import { entryKey } from "#src/registry/entry-key.function";
import { importLine } from "#src/registry/import-line.function";
import { mobileRoute } from "#src/registry/mobile-route.function";
import { neighbours } from "#src/registry/neighbours.function";
import { webPath } from "#src/registry/web-path.function";

/** `value`, or a thrown error naming what was missing (keeps tests free of non-null assertions). */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

describe("registry functions", () => {
  it("keeps today's URLs: /button and /pro-kanban, and finds every entry back from its path", () => {
    expect(webPath({ tier: "free", slug: "button" })).toBe("/button");
    expect(webPath({ tier: "pro", slug: "kanban" })).toBe("/pro-kanban");
    for (const entry of COMPONENTS) expect(byWebPath(webPath(entry))).toBe(entry);
    expect(byWebPath("/nothing-here")).toBeUndefined();
  });

  it("round-trips every category through its URL segment", () => {
    expect(categoryPath()).toBe("/components");
    expect(categoryPath("inputs_and_forms")).toBe("/components/inputs-and-forms");
    for (const category of ComponentCategory) {
      expect(categoryFromSegment(must(categoryPath(category).split("/").at(-1), category))).toBe(
        category,
      );
    }
    expect(categoryFromSegment("nope")).toBeUndefined();
  });

  it("writes the import line per platform", () => {
    const button = must(bySlug("free", "button"), "free/button");
    expect(importLine(button, "react")).toBe('import { Button } from "@stackra/ui/react";');
  });

  it("derives snake_case catalogue keys", () => {
    const keys = componentKeys({
      tier: "free",
      slug: "icon-button",
      examples: [{ id: "full-width" }],
    });
    expect(keys.title).toBe("showcase::component.free.icon_button.title");
    expect(keys.examples["full-width"]?.title).toBe(
      "showcase::example.free.icon_button.full_width.title",
    );
  });

  it("lists in category order, free only in core, and pages within a category", () => {
    const actions = byCategory("actions", { platform: "react" });
    expect(actions.every((entry) => entry.category === "actions")).toBe(true);
    expect(COMPONENTS.every((entry) => entry.tier === "free")).toBe(true);
    const all = byCategory(undefined);
    expect(all).toHaveLength(COMPONENTS.length);
    expect(all[0]?.category).toBe("foundations");

    const middle = must(actions[1], "second action");
    const { previous, next } = neighbours(middle, "react");
    expect(previous).toBe(actions[0]);
    expect(next).toBe(actions[2]);
    expect(neighbours(must(actions[0], "first action"), "react").previous).toBeUndefined();
  });

  it("keys entries by tier and slug and targets the one mobile route", () => {
    expect(new Set(COMPONENTS.map(entryKey)).size).toBe(COMPONENTS.length);
    expect(mobileRoute({ tier: "free", slug: "button" }, "api")).toEqual({
      name: "Component",
      params: { tier: "free", slug: "button", tab: "api" },
    });
  });
});
