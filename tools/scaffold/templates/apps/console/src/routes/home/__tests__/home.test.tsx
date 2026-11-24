/**
 * Stackra file contract:
 * Purpose: proves the home route is declared at `/` and its page renders the empty-panel message.
 * Boundary: a memory router in jsdom; no network.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14); ADR 0022 (test placement).
 */
import { kindOf } from "@stackra/container";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";

describe("HomeRoute", () => {
  it("is a route at /", () => {
    expect(kindOf(HomeRoute)).toMatchObject({ kind: "route", options: { path: "/" } });
  });

  it("renders its page at /", () => {
    const router = createMemoryRouter([{ path: "/", element: <Home /> }]);
    render(<RouterProvider router={router} />);
    expect(screen.getByText("No resources registered yet.")).toBeTruthy();
  });
});
