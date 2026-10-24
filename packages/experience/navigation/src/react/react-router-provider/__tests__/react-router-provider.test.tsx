/**
 * Stackra file contract:
 * Purpose: proves the ReactRouterProvider fills the `Link` seam of `@stackra/ui`: an internal link navigates the React
 *          Router memory router on the client and shows the router's own href (the basename included), while an
 *          external link leaves the router alone.
 * Boundary: jsdom with real HeroUI and React Aria and a React Router memory data router; no page loads.
 * Runtime: browser
 * Governing contract: ADR 0317 (decision 2); ADR 0303 (decision 1); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-180
import { Link } from "@stackra/ui/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ReactRouterProvider } from "#react/react-router-provider/react-router-provider";

/** A memory router whose home page holds links inside the provider under test. */
function build() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <ReactRouterProvider>
            <Link href="/orders">Orders</Link>
            <Link href="https://example.com/docs" isExternal>
              Docs
            </Link>
          </ReactRouterProvider>
        ),
      },
      { path: "/orders", element: <h1>Orders list</h1> },
    ],
    { basename: "/app", initialEntries: ["/app"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("ReactRouterProvider", () => {
  it("shows the router's own href, basename included", () => {
    build();
    expect(screen.getByRole("link", { name: "Orders" }).getAttribute("href")).toBe("/app/orders");
  });

  it("navigates an internal link on the client through the router", async () => {
    const router = build();
    act(() => screen.getByRole("link", { name: "Orders" }).click());
    await waitFor(() => expect(router.state.location.pathname).toBe("/orders"));
    expect(screen.getByRole("heading", { name: "Orders list" })).toBeTruthy();
  });

  it("leaves an external link to the browser", () => {
    const router = build();
    const link = screen.getByRole("link", { name: /Docs/ });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("href")).toBe("https://example.com/docs");
    expect(router.state.location.pathname).toBe("/");
  });
});
