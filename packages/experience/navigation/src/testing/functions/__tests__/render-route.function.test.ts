// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `renderRoute`: the page renders with its loader's data, params and query at the route's path,
 *          a `Routes.<key>` ref mounts the page gen's route table bound and the parts' fakes come back on the result,
 *          the stub sits inside the given providers, a submit runs the route's `submit`, and an unregistered ref is
 *          refused.
 * Boundary: test only, jsdom; built on `@stackra/testing/react`; clears the route and page tables after each test.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269 (decisions 3 and 6).
 */
import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { Form, useActionData } from "react-router";

import { Route } from "#core/bases/route.base";
import { ROUTE_PAGE_TABLE } from "#core/constants/route-page-table.constant";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { routeRef } from "#core/functions/route-ref.function";
import type { RouteContext } from "#core/types/route-context.type";
import { renderRoute } from "#testing/functions/render-route.function";

class GreetRoute extends Route({ path: "/greet/:name" }) {
  override loader(ctx: RouteContext<this>) {
    return { greeting: `Hello ${String(ctx.params.name)}` };
  }

  override async submit(ctx: RouteContext<this>) {
    const form = await ctx.formData();
    return { echoed: form["reply"] };
  }
}

/** The page: the greeting with the query's tone, and a reply form. */
function Greet({
  data,
  search,
}: {
  readonly data: { readonly greeting: string };
  readonly search: { readonly tone?: string };
}) {
  const answer = useActionData() as { readonly echoed: string } | undefined;
  return createElement(
    "main",
    null,
    createElement("h1", null, `${data.greeting}${search.tone ?? ""}`),
    createElement(
      Form,
      { method: "post" },
      createElement("input", { name: "reply", "aria-label": "Reply", defaultValue: "hi" }),
      createElement("button", { type: "submit" }, "Send"),
    ),
    answer === undefined ? null : createElement("output", null, answer.echoed),
  );
}

/** A provider that marks the tree. */
function Marked({ children }: { readonly children?: ReactNode }) {
  return createElement("div", { "data-testid": "provider" }, children);
}

const Routes = { greet: routeRef<typeof GreetRoute>("greet") };

afterEach(() => {
  ROUTE_TABLE.clear();
  ROUTE_PAGE_TABLE.clear();
});

describe("renderRoute", () => {
  it("renders the page with the loader's data at the route's path filled with params", async () => {
    renderRoute(GreetRoute, {
      component: Greet as never,
      params: { name: "Lina" },
      search: { tone: "!" },
    });
    expect(await screen.findByRole("heading", { name: "Hello Lina!" })).toBeTruthy();
  });

  it("mounts the page gen's table bound to a ref and hands the parts' fakes back", async () => {
    registerRoutes({ greet: { route: GreetRoute, page: Greet } });
    const counter = { visits: 0 };
    const view = renderRoute(Routes.greet, {
      path: "/greet/Omar",
      services: [() => ({ context: { counter } })],
    }) as ReturnType<typeof renderRoute> & { readonly counter: unknown };
    expect(view.counter).toBe(counter);
    expect(await screen.findByRole("heading", { name: "Hello Omar" })).toBeTruthy();
  });

  it("mounts the stub inside the given providers", async () => {
    renderRoute(GreetRoute, {
      component: Greet as never,
      path: "/greet/Sara",
      providers: [Marked],
    });
    const heading = await screen.findByRole("heading", { name: "Hello Sara" });
    expect(screen.getByTestId("provider").contains(heading)).toBe(true);
  });

  it("runs the route's submit for the page's form", async () => {
    renderRoute(GreetRoute, { component: Greet as never, path: "/greet/Lina" });
    fireEvent.click(await screen.findByRole("button", { name: "Send" }));
    expect((await screen.findByRole("status")).textContent).toBe("hi");
  });

  it("refuses a ref no registerRoutes call registered", () => {
    expect(() => renderRoute(routeRef("missing"))).toThrow(RangeError);
  });
});
