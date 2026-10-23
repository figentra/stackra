/**
 * Stackra file contract:
 * Purpose: proves the index route sits at `/`, titles itself, and links every page it is given, keeping the search
 *          params so the scheme and direction carry over.
 * Boundary: a memory router in jsdom; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";

describe("HomeRoute", () => {
  it("renders its page at / with a link to every page", () => {
    const router = createMemoryRouter(
      [{ path: HomeRoute.path, element: <Home pages={[{ path: "/a", title: "Page A" }]} /> }],
      { initialEntries: ["/?scheme=dark&locale=ar"] },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("heading", { level: 1, name: HomeRoute.title })).toBeTruthy();
    expect(document.title).toBe(HomeRoute.title);
    expect(screen.getByRole("link", { name: "Page A" }).getAttribute("href")).toBe(
      "/a?scheme=dark&locale=ar",
    );
  });
});
