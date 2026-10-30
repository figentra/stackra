/**
 * Stackra file contract:
 * Purpose: proves the component ⋯ menu is one stable item that opens the registry's HeroUI docs URL, hops to the
 *          category's neighbours through the given actions, and labels itself with the translator it is given.
 * Boundary: the item description and the registry alone; no navigator or native module loads.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.3 and 4; ADR 0022 (test placement).
 */
import { bySlug, neighbours } from "@stackra/showcase";
import { describe, expect, it, vi } from "vitest";

import { componentMenuItems } from "../component-menu-items.function";

const button = bySlug("free", "button");
if (!button) throw new Error("free/button is missing from the registry");

describe("componentMenuItems", () => {
  it("describes one stable menu that opens the docs and hops to the neighbours", () => {
    const openUrl = vi.fn();
    const jumpTo = vi.fn();
    const [item] = componentMenuItems(button, { openUrl, jumpTo });
    if (item?.type !== "menu") throw new Error("expected a menu item");
    expect(item.identifier).toBe("component-menu");
    const [docs, ...hops] = item.menu.items;
    if (docs?.type !== "action") throw new Error("expected the docs action");
    expect(docs.label).toBe("Open HeroUI docs");
    docs.onPress();
    expect(openUrl).toHaveBeenCalledWith(button.hero.native?.docsUrl);
    const { previous, next } = neighbours(button, "native");
    expect(hops).toHaveLength([previous, next].filter(Boolean).length);
    const last = hops.at(-1);
    if (last?.type === "action") last.onPress();
    expect(jumpTo).toHaveBeenCalledWith(next ?? previous);
  });

  it("labels the menu with the translator it is given", () => {
    const [item] = componentMenuItems(
      button,
      { openUrl: vi.fn(), jumpTo: vi.fn() },
      (key) => `[${key}]`,
    );
    expect((item as { label?: string } | undefined)?.label).toBe("[showcase::ui.menu]");
  });
});
