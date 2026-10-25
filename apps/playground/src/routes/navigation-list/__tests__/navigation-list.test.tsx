/**
 * Stackra file contract:
 * Purpose: proves the navigation-list page titles the document, names every navigation landmark once, shows links that
 *          keep the scheme and language, the current page and an entry that only holds it, a group heading over its
 *          nested list, badges with none for zero, a disabled entry and a counted press-only entry, shortcut and
 *          compact lists, an Arabic list in a right-to-left block, and a live list whose press moves the current page.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and a memory router; the theme CSS is not
 *           loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-162
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { NavigationList } from "#src/routes/navigation-list/navigation-list";
import { NavigationListRoute } from "#src/routes/navigation-list/navigation-list.route";

function renderPage(url = "/navigation-list?scheme=dark&locale=ar") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <DesignSystemProvider colorScheme="light" locale="en">
        <PlaygroundIcons>
          <NavigationList />
        </PlaygroundIcons>
      </DesignSystemProvider>
    </MemoryRouter>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Navigation list page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /navigation-list under Navigation", () => {
    renderPage();
    expect(NavigationListRoute.path).toBe("/navigation-list");
    expect(NavigationListRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: "Navigation list" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Navigation list · Stackra Playground");
  });

  it("names every navigation landmark once", () => {
    renderPage();
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(names.length).toBeGreaterThan(8);
    expect(new Set(names).size).toBe(names.length);
  });

  it("shows links that keep the scheme and language", () => {
    renderPage();
    const basics = section("Basics");
    expect(basics.getByRole("link", { name: "Orders" }).getAttribute("href")).toBe(
      "/navigation-list?scheme=dark&locale=ar#navigation-list-basics",
    );
    expect(basics.getAllByRole("link")).toHaveLength(3);
  });

  it("marks the current page, and the link that only holds it", () => {
    renderPage();
    const current = section("Current page");
    const lists = current.getAllByRole("navigation");
    expect(
      within(lists[0] as HTMLElement)
        .getByRole("link", { name: "Orders" })
        .getAttribute("aria-current"),
    ).toBe("page");
    const holding = within(lists[1] as HTMLElement);
    expect(holding.getByRole("link", { name: "Orders" }).getAttribute("aria-current")).toBe("true");
    expect(holding.getByRole("link", { name: "Returns" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("shows a group heading over its list, and nested entries under a link", () => {
    renderPage();
    const groups = section("Groups and nesting");
    expect(groups.queryByRole("link", { name: "Settings" })).toBeNull();
    const nested = groups.getByRole("list", { name: "Settings" });
    expect(within(nested).getAllByRole("link")).toHaveLength(2);
    const orders = groups.getByRole("link", { name: "Orders" }).closest("li");
    expect(within(orders as HTMLElement).getByRole("link", { name: "Returns" })).toBeTruthy();
  });

  it("shows badges, and none for zero", () => {
    renderPage();
    const badges = section("Badges");
    expect(badges.getByRole("link", { name: /^Inbox\s*12$/ })).toBeTruthy();
    expect(badges.getByRole("link", { name: /^Orders\s*New$/ })).toBeTruthy();
    expect(badges.getByRole("link", { name: "Customers" })).toBeTruthy();
  });

  it("refuses the disabled entry and counts the presses of the press-only one", () => {
    renderPage();
    const states = section("Disabled and press-only");
    const archive = states.getByRole("link", { name: "Archive" });
    expect(archive.getAttribute("aria-disabled")).toBe("true");
    expect(archive.hasAttribute("href")).toBe(false);
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 0 times.");
    press(states.getByRole("link", { name: "Run report" }));
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 1 time.");
  });

  it("shows the shortcut list and the compact rail with every label as a name", () => {
    renderPage();
    expect(section("Shortcuts").getAllByRole("link")).toHaveLength(2);
    const rail = section("Compact");
    expect(rail.getByRole("link", { name: /^Home$/ })).toBeTruthy();
    expect(rail.getByRole("link", { name: /^Orders\s*3$/ }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("draws the Arabic list in a right-to-left block", () => {
    renderPage();
    const list = section("Arabic").getByRole("navigation", { name: "قائمة التنقل" });
    expect(list.closest("[dir='rtl']")?.getAttribute("lang")).toBe("ar");
    expect(within(list).getByRole("link", { name: "الطلبات" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("moves the current page on a press in the live list and reports it", () => {
    renderPage();
    const live = section("Try it");
    expect(screen.getByTestId("current-page").textContent).toBe("Current page: Home");
    press(live.getByRole("link", { name: "Customers" }));
    expect(screen.getByTestId("current-page").textContent).toBe("Current page: Customers");
    expect(live.getByRole("link", { name: "Customers" }).getAttribute("aria-current")).toBe("page");
    expect(live.getByRole("link", { name: "Home" }).hasAttribute("aria-current")).toBe(false);
  });
});
