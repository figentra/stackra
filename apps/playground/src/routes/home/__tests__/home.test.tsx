/**
 * Stackra file contract:
 * Purpose: proves the index route sits at `/`, titles itself, shows its live showcase, and links every page it is
 *          given in its gallery under its category (in category order), keeping the search params so the scheme and
 *          direction carry over; the Free / Pro filter narrows the gallery and a Pro page wears its badge.
 * Boundary: a memory router in jsdom; no network. Rendered alone, outside the shell, so the search button (which
 *          needs the shell's palette) is left out.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010 sta-422:FR-002 sta-422:P-003
import { act, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";
import type { PageLink } from "#src/types/page-link.type";

const PAGES: readonly PageLink[] = [
  { path: "/b", title: "Page B", category: "Charts" },
  { path: "/a", title: "Page A", category: "Foundations" },
  { path: "/pro-c", title: "Page C", category: "Charts" },
];

function renderHome(url = "/") {
  const router = createMemoryRouter([{ path: HomeRoute.path, element: <Home pages={PAGES} /> }], {
    initialEntries: [url],
  });
  render(<RouterProvider router={router} />);
}

describe("HomeRoute", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
  });

  it("lists the pages under their category, in category order, in the Pages navigation", () => {
    renderHome();
    const gallery = within(screen.getByRole("navigation", { name: "Pages" }));
    expect(
      gallery.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["Foundations", "Charts"]);
    expect(
      within(gallery.getByRole("list", { name: "Charts" }))
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["PBPage B", "PCPage CPro"]);
  });

  it("renders its page at / with a link to every page that keeps the search params", () => {
    renderHome("/?scheme=dark&locale=ar");
    expect(screen.getByRole("heading", { level: 1, name: HomeRoute.title })).toBeTruthy();
    expect(document.title).toBe(HomeRoute.title);
    expect(screen.getByRole("link", { name: /Page A/ }).getAttribute("href")).toBe(
      "/a?scheme=dark&locale=ar",
    );
    // The hero's jump to the gallery keeps the view in the address too.
    expect(screen.getByRole("link", { name: /Browse components/ }).getAttribute("href")).toBe(
      "/?scheme=dark&locale=ar#components",
    );
  });

  it("narrows the gallery to one tier", () => {
    renderHome();
    act(() => screen.getByRole("radio", { name: "Pro" }).click());
    const gallery = within(screen.getByRole("navigation", { name: "Pages" }));
    expect(gallery.getAllByRole("link").map((link) => link.textContent)).toEqual(["PCPage CPro"]);
    act(() => screen.getByRole("radio", { name: "Free" }).click());
    expect(gallery.queryByText("Page C")).toBeNull();
    expect(gallery.getAllByRole("link")).toHaveLength(2);
  });

  it("shows the live showcase, built from the system's components", () => {
    renderHome();
    const showcase = within(screen.getByRole("region", { name: "In use" }));
    expect(showcase.getByRole("heading", { level: 3, name: "Invite your team" })).toBeTruthy();
    expect(showcase.getByRole("textbox", { name: "Work email" })).toBeTruthy();
    act(() => showcase.getByRole("button", { name: "Send invite" }).click());
    expect(showcase.getByText(/Invite sent/)).toBeTruthy();
  });
});
