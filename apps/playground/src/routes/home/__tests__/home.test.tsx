/**
 * Stackra file contract:
 * Purpose: proves the index route sits at `/`, draws this visit's hero (the one the visit keeps) with its h1 and
 *          the document title that starts with it, counts the built components, links every category's group card to
 *          its tab on the components index keeping the search params, shows the recent row only once a page was
 *          opened, and assembles the stack from the icon button on its picture.
 * Boundary: a memory router in jsdom; no network. Rendered alone, outside the shell.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010 sta-422:FR-002 sta-422:P-003
import "#src/__tests__/stub-browser-apis";

import { CATEGORIES, COMPONENTS } from "@stackra/showcase";
import { act, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { HERO_VISIT } from "#src/components/landing-hero/hero-visit.constant";
import { rememberRecent } from "#src/components/recent-chips";
import { routePath } from "#src/components/playground-pages/route-path.function";
import { Home } from "#src/routes/home/home";
import { HomeRoute } from "#src/routes/home/home.route";

function renderHome(url = "/") {
  const router = createMemoryRouter([{ path: routePath(HomeRoute), element: <Home /> }], {
    initialEntries: [url],
  });
  render(<RouterProvider router={router} />);
}

describe("HomeRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    // This visit's hero is the stack: the other two read the shell's design-system state.
    sessionStorage.setItem(HERO_VISIT.session, "stack");
    Element.prototype.scrollIntoView = () => undefined;
  });

  it("renders its page at / with a group card per non-empty category that keeps the search params", async () => {
    renderHome("/?scheme=dark&locale=ar");
    // The hero loads on demand.
    const heading = await screen.findByRole("heading", { level: 1 }, { timeout: 15_000 });
    expect(heading.textContent).toBe("Tokens. Components. Products.");
    expect(document.title).toBe(`${heading.textContent} · ${HomeRoute.title}`);
    const categories = within(screen.getByRole("region", { name: "Categories" }));
    const filled = CATEGORIES.filter(({ id }) =>
      COMPONENTS.some((entry) => entry.category === id && entry.status !== "planned"),
    );
    expect(categories.getAllByRole("link")).toHaveLength(filled.length);
    expect(categories.getByRole("link", { name: /Actions/ }).getAttribute("href")).toBe(
      "/components/actions?scheme=dark&locale=ar",
    );
    expect(categories.getByRole("link", { name: /Inputs and forms/ }).getAttribute("href")).toBe(
      "/components/inputs-and-forms?scheme=dark&locale=ar",
    );
  });

  it("counts the built components, not the planned ones", async () => {
    renderHome();
    const built = COMPONENTS.filter((entry) => entry.status !== "planned").length;
    expect(
      await screen.findByText(new RegExp(`^${built} components`), undefined, { timeout: 15_000 }),
    ).toBeTruthy();
  });

  it("shows the recently viewed row only once a page was opened", () => {
    renderHome();
    expect(screen.queryByRole("region", { name: "Recently viewed" })).toBeNull();
    rememberRecent("/button");
    rememberRecent("/gone");
    renderHome();
    const recent = within(screen.getByRole("region", { name: "Recently viewed" }));
    expect(recent.getAllByRole("link")).toHaveLength(1);
    expect(recent.getByRole("link", { name: /Button/ }).getAttribute("href")).toBe("/button");
  });

  it("assembles the stack from the button on its picture, and has no search of its own", async () => {
    renderHome();
    const assemble = await screen.findByRole(
      "button",
      { name: "Assemble the stack" },
      { timeout: 15_000 },
    );
    expect(assemble.getAttribute("aria-pressed")).toBe("false");
    act(() => assemble.click());
    expect(
      screen.getByRole("button", { name: "Explode the stack" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.queryByRole("button", { name: /Search/ })).toBeNull();
  });
});
