// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `renderLayout`: the layout's component renders with its loader's data over an empty outlet at
 *          any path, the input's members reach the loader, and the parts' fakes come back on the result.
 * Boundary: test only, jsdom; built on `@stackra/testing/react`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269 (decisions 3 and 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { screen } from "@stackra/testing/react";
import { createElement } from "react";
import { useLoaderData } from "react-router";

import { Layout } from "#core/bases/layout.base";
import type { LayoutContext } from "#core/types/layout-context.type";
import { renderLayout } from "#testing/functions/render-layout.function";

class ShellLayout extends Layout {
  override loader(ctx: LayoutContext<this>) {
    const { session } = ctx as unknown as { session: { readonly name: string } };
    return { user: session.name };
  }
}

/** The frame: the signed-in user in the main navigation. */
function Shell() {
  const data = useLoaderData() as { readonly user: string };
  return createElement("nav", { "aria-label": "Main navigation" }, data.user);
}

describe("renderLayout", () => {
  it("renders the layout's component with its loader's data at any path", async () => {
    renderLayout(ShellLayout, { component: Shell, path: "/orders", session: { name: "Lina" } });
    const nav = await screen.findByRole("navigation", { name: "Main navigation" });
    expect(nav.textContent).toBe("Lina");
  });

  it("hands the parts' fakes back on the result", () => {
    const stores = { ui: { sidebarCollapsed: false } };
    const view = renderLayout(ShellLayout, {
      component: Shell,
      session: { name: "Omar" },
      services: [() => ({ context: { stores } })],
    }) as ReturnType<typeof renderLayout> & { readonly stores: unknown };
    expect(view.stores).toBe(stores);
  });
});
