// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `RootErrorBoundary`: a thrown 404 renders the not-found page with a home link in the mount, a
 *          refusal's kind decides its state (forbidden), an unexpected error renders the error state with a retry, and
 *          `statusOf` reads each kind of error.
 * Boundary: test only; jsdom with a memory data router whose loaders throw; `@stackra/ui/react` is stubbed with plain
 *           elements so the test reads what the boundary hands it, not HeroUI's rendering.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0305 (rule 35); ADR 0324.
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, data, RouterProvider } from "react-router";
import { vi } from "vitest";

import { Route } from "#core/bases/route.base";
import { ROUTE_TABLE } from "#core/constants/route-table.constant";
import { registerRoutes } from "#core/functions/register-routes.function";
import { RootErrorBoundary } from "#react/root-error-boundary/root-error-boundary";
import { statusOf } from "#react/root-error-boundary/status-of.function";

vi.mock("@stackra/ui/react", () => ({
  EmptyState: ({ title, actions }: { title: ReactNode; actions: ReactNode }) => (
    <section data-testid="empty">
      <h1>{title}</h1>
      {actions}
    </section>
  ),
  ErrorState: ({
    kind,
    title,
    actions,
    retry,
  }: {
    kind: string;
    title: ReactNode;
    actions: ReactNode;
    retry: { label: string };
  }) => (
    <section data-testid="error" data-kind={kind}>
      <h1>{title}</h1>
      {actions}
      <button type="button">{retry.label}</button>
    </section>
  ),
}));

class LandingRoute extends Route({ path: "/" }) {}

class ForbiddenError extends Refusal({ kind: ErrorKind.Forbidden }) {}

/** Mounts a route whose loader throws `error`, under the boundary. */
function mountThrowing(error: unknown, path = "/x", prefix?: string) {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        loader: () => {
          throw error;
        },
        element: <p>page</p>,
        ErrorBoundary: () => <RootErrorBoundary home="landing" prefix={prefix} />,
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  ROUTE_TABLE.clear();
});

describe("RootErrorBoundary", () => {
  it("renders the not-found page with a way home in the mount", async () => {
    registerRoutes({ landing: LandingRoute });
    mountThrowing(data({ code: "page_not_found" }, { status: 404 }), "/ar-sa/x", "/ar-sa");
    expect(await screen.findByTestId("empty")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/ar-sa/");
  });

  it("renders a refusal's state and an unexpected error with a retry", async () => {
    mountThrowing(ForbiddenError.create());
    expect((await screen.findByTestId("error")).dataset["kind"]).toBe("forbidden");
    cleanup();
    mountThrowing(new Error("boom"));
    expect((await screen.findByTestId("error")).dataset["kind"]).toBe("unexpected");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/");
  });
});

describe("statusOf", () => {
  it("reads an error response, a refusal and anything else", () => {
    expect(statusOf(ForbiddenError.create())).toBe(403);
    expect(statusOf(new Error("boom"))).toBe(500);
  });
});
