/**
 * Stackra file contract:
 * Purpose: proves the index route sits at `/`, titles itself, and links every page it is given under its category (in
 *          category order), keeping the search params so the scheme and direction carry over.
 * Boundary: a memory router in jsdom; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010
import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";

describe("HomeRoute", () => {
  it("lists the pages under their category, in category order", () => {
    const router = createMemoryRouter(
      [
        {
          path: HomeRoute.path,
          element: (
            <Home
              pages={[
                { path: "/pro-b", title: "Page B", category: "Charts" },
                { path: "/a", title: "Page A", category: "Foundations" },
              ]}
            />
          ),
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["Foundations", "Charts"]);
    expect(within(screen.getByRole("list", { name: "Charts" })).getByRole("link").textContent).toBe(
      "Page B, Pro",
    );
  });

  it("renders its page at / with a link to every page", () => {
    const router = createMemoryRouter(
      [
        {
          path: HomeRoute.path,
          element: (
            <Home
              pages={[
                { path: "/pro-b", title: "Page B", category: "Charts" },
                { path: "/a", title: "Page A", category: "Foundations" },
              ]}
            />
          ),
        },
      ],
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
