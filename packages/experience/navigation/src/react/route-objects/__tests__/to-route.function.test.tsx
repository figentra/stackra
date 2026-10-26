// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `toRoute`, `toLayout` and `toRoot` together: paths become relative (`/` an index), the tree
 *          mounts once per locale prefix, a page renders its loader's data, params and query, a layout's loader runs
 *          before its children and its redirect wins, a route without a page that redirects is followed, a thrown
 *          `notFound` reaches the mount's root boundary, and a bad prefix is refused.
 * Boundary: test only; jsdom with a memory data router; no context keys (the routes need no container).
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decisions 14 and 16); ADR 0297 (decision 4); ADR 0305 (rule 35).
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { vi } from "vitest";

import { Layout } from "#core/bases/layout.base";
import { Route } from "#core/bases/route.base";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteProps } from "#core/types/route-props.type";
import { toLayout } from "#react/route-objects/to-layout.function";
import { toRoot } from "#react/route-objects/to-root.function";
import { toRoute } from "#react/route-objects/to-route.function";

vi.mock("@stackra/ui/react", () => ({
  EmptyState: ({ title, actions }: { title: ReactNode; actions: ReactNode }) => (
    <section data-testid="not-found">
      {title}
      {actions}
    </section>
  ),
  ErrorState: ({ title }: { title: ReactNode }) => <section data-testid="error">{title}</section>,
}));

class ShellLayout extends Layout {
  override loader(ctx: RouteContext<this>) {
    return ctx.search["signedOut"] === undefined ? { user: "lina" } : ctx.redirect("/login");
  }
}

class DashboardRoute extends Route({ path: "/", layout: ShellLayout }) {
  override loader(ctx: RouteContext<this>) {
    return { locale: ctx.locale, user: (ctx as unknown as { user: string }).user };
  }
}

class ProductRoute extends Route({ path: "/store/:slug", layout: ShellLayout }) {
  override loader(ctx: RouteContext<this>) {
    if (ctx.params.slug === "gone") throw ctx.notFound({ code: "product_not_found" });
    return { slug: ctx.params.slug };
  }
}

class OpenRoute extends Route({ path: "/open", layout: ShellLayout }) {
  override loader(ctx: RouteContext<this>) {
    return ctx.redirect(`/store/${ctx.search["slug"] ?? "tee"}`);
  }
}

class SignInRoute extends Route({ path: "/login" }) {}

function Shell() {
  return (
    <main>
      <Outlet />
    </main>
  );
}

function Dashboard({ data }: RouteProps<typeof DashboardRoute>) {
  return <p>{`hello ${data.user}`}</p>;
}

function Product({ data, search }: RouteProps<typeof ProductRoute>) {
  return <p>{`product ${data.slug} ${search["ref"] ?? ""}`}</p>;
}

/** The app's route tree, two locale mounts. */
const routes = toRoot({ prefixes: { en: "", ar: "/ar" } }, [
  toRoute(SignInRoute, { component: () => <p>sign in</p> }),
  toLayout(ShellLayout, { component: Shell }, [
    toRoute(DashboardRoute, { component: Dashboard }),
    toRoute(ProductRoute, { component: Product }),
    toRoute(OpenRoute),
  ]),
]);

/** Renders the tree at `path`. */
function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

afterEach(() => {
  cleanup();
});

describe("toRoute", () => {
  it("makes paths relative, `/` an index", () => {
    expect(toRoute(DashboardRoute)).toMatchObject({
      index: true,
      handle: { route: DashboardRoute },
    });
    expect(toRoute(ProductRoute)).toMatchObject({ path: "store/:slug" });
  });

  it("renders a page with its data, params and query, in every mount", async () => {
    renderAt("/ar/store/tee?ref=mail");
    expect(await screen.findByText("product tee mail")).toBeTruthy();
    cleanup();
    renderAt("/");
    expect(await screen.findByText("hello lina")).toBeTruthy();
  });

  it("follows a route's redirect and a layout's redirect", async () => {
    renderAt("/open?slug=cap");
    expect(await screen.findByText("product cap")).toBeTruthy();
    cleanup();
    renderAt("/?signedOut=1");
    expect(await screen.findByText("sign in")).toBeTruthy();
  });

  it("renders a thrown notFound through the mount's boundary", async () => {
    renderAt("/ar/store/gone");
    expect(await screen.findByTestId("not-found")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/ar/");
  });
});

describe("toLayout", () => {
  it("is a pathless route around its children", () => {
    const child = toRoute(DashboardRoute);
    const layout = toLayout(ShellLayout, {}, [child]);
    expect(layout).toMatchObject({ handle: { layout: ShellLayout }, children: [child] });
    expect(layout.path).toBeUndefined();
  });
});

describe("toRoot", () => {
  it("refuses a prefix that is not a lowercase tag", () => {
    expect(() => toRoot({ prefixes: { "ar-SA": "/ar-SA" } }, [])).toThrow(RangeError);
  });
});
