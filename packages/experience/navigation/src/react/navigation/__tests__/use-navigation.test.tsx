/**
 * Stackra file contract:
 * Purpose: unit tests of `useNavigation`: with no argument it is the router's navigation state; with the generated tree
 *          each entry has its href in the mount and `isCurrent` on its page and below; entries the actor's held
 *          permissions do not cover, flagged entries and emptied groups go.
 * Boundary: test only; jsdom with `renderHook` under a memory data router; targets are local stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0214; ADR 0297 (decision 4).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import { PermissionSnapshotService } from "@stackra/iam";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { navigation } from "#core/functions/navigation.function";
import { useNavigation } from "#react/navigation/use-navigation";

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a panel token stand-in
class TenantAdminPanel {}

const flagOff = {
  key: "orders.quick_order",
  default: false,
  scopes: [],
  expires: null,
  removalIssue: null,
  label: "orders::flags.quick_order.label",
} as const;

const Navigation = navigation(TenantAdminPanel, [
  {
    group: "orders::nav.sales",
    items: [
      { label: "orders::resources.order.title", to: { base: "/orders/orders" }, icon: "receipt" },
      { label: "catalogue::resources.product.title", to: { base: "/catalogue/products" } },
      {
        label: "access_log::nav.access_log",
        to: { base: "/access-log/entries", permission: "access_log.access_log_entry.read" },
      },
    ],
  },
  { group: "orders::nav.hidden", items: [{ label: "x", to: "/x", flag: flagOff }] },
]);

class ConsoleI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

/** A wrapper rendering `children` in a data router at `path`, holding `held` permissions when given. */
async function wrapperAt(path: string, held?: readonly string[]) {
  const overrides = new Map<Token, object>([[I18nConfig, buildConfig(ConsoleI18nConfig)]]);
  if (held !== undefined)
    overrides.set(PermissionSnapshotService, {
      current: () => held,
      subscribe: () => () => undefined,
      can: (permission: string, keys: readonly string[]) => keys.includes(permission),
    });
  const container = await Container.create([], { overrides });
  return ({ children }: { children: ReactNode }) => {
    const [router] = useState(() =>
      createMemoryRouter([{ path: "*", element: children }], { initialEntries: [path] }),
    );
    return (
      <ContainerProvider container={container}>
        <RouterProvider router={router} />
      </ContainerProvider>
    );
  };
}

describe("useNavigation", () => {
  it("is the router's state with no argument", async () => {
    const { result } = renderHook(() => useNavigation(), { wrapper: await wrapperAt("/") });
    expect(result.current.state).toBe("idle");
  });

  it("resolves the generated tree for the viewer", async () => {
    const { result } = renderHook(() => useNavigation(Navigation), {
      wrapper: await wrapperAt("/ar/orders/orders/ord_1", []),
    });
    expect(result.current).toEqual([
      {
        group: "orders::nav.sales",
        items: [
          {
            label: "orders::resources.order.title",
            href: "/ar/orders/orders",
            isCurrent: true,
            icon: "receipt",
          },
          {
            label: "catalogue::resources.product.title",
            href: "/ar/catalogue/products",
            isCurrent: false,
          },
        ],
      },
    ]);
  });

  it("shows an entry the held permissions cover, and every entry without iam bound", async () => {
    const held = renderHook(() => useNavigation(Navigation), {
      wrapper: await wrapperAt("/", ["access_log.access_log_entry.read"]),
    });
    expect(held.result.current[0]?.items.map((item) => item.label)).toContain(
      "access_log::nav.access_log",
    );
    const open = renderHook(() => useNavigation(Navigation), { wrapper: await wrapperAt("/") });
    expect(open.result.current[0]?.items).toHaveLength(3);
  });
});
