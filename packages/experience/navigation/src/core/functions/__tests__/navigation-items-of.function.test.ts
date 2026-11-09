/**
 * Stackra file contract:
 * Purpose: unit tests of `navigationItemsOf`: routes and links become places with their href and translated label,
 *          groups headings over their places with ids under the parent, the caller's `isCurrent` marks a route, and
 *          actions, separators and groups left empty are dropped.
 * Boundary: test only; pure input, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0111 (decisions 1 and 3); ADR 0317 (decision 3).
 */
import { describe, expect, it } from "vitest";

import { MenuItemKind } from "#core/enums/menu-item-kind.enum";
import { navigationItemsOf } from "#core/functions/navigation-items-of.function";
import type { ResolvedMenuItem } from "#core/types/resolved-menu-item.type";

const ITEMS: readonly ResolvedMenuItem[] = [
  { kind: MenuItemKind.Route, label: "web::nav.orders", to: "/orders", end: false, icon: "check" },
  {
    kind: MenuItemKind.Group,
    label: "web::nav.more",
    items: [
      {
        kind: MenuItemKind.Link,
        label: "web::nav.docs",
        href: "https://docs.test",
        external: true,
      },
    ],
  },
  { kind: MenuItemKind.Group, label: "web::nav.empty", items: [] },
  { kind: MenuItemKind.Separator, label: "" },
  {
    kind: MenuItemKind.Action,
    label: "orders.order.cancel@1",
    action: { kind: "action", key: "orders.order.cancel@1" } as never,
    input: undefined,
    destructive: true,
  },
];

/** A translator that echoes the key. */
const label = (key: string) => `t:${key}`;

describe("navigationItemsOf", () => {
  it("draws routes, links and groups as places, translated, under the parent's ids", () => {
    expect(navigationItemsOf(ITEMS, { label }, "main")).toEqual([
      {
        id: "main.0",
        label: "t:web::nav.orders",
        href: "/orders",
        icon: "check",
        isCurrent: false,
      },
      {
        id: "main.1",
        label: "t:web::nav.more",
        children: [
          { id: "main.1.0", label: "t:web::nav.docs", href: "https://docs.test", icon: undefined },
        ],
      },
    ]);
  });

  it("marks the route the caller says is current, with its `end`", () => {
    const seen: [string, boolean][] = [];
    const [orders] = navigationItemsOf(ITEMS, {
      label: (key) => key,
      isCurrent: (href, end) => {
        seen.push([href, end]);
        return true;
      },
    });
    expect(orders?.isCurrent).toBe(true);
    expect(seen).toEqual([["/orders", false]]);
  });
});
