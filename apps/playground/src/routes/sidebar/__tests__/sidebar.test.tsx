/**
 * Stackra file contract:
 * Purpose: proves the sidebar page titles the document, names every navigation landmark once, shows the expanded
 *          sidebar with its brand and account, the collapsed rail, the current place with badges, a sidebar without its
 *          toggle, an Arabic sidebar in a right-to-left block, and a live sidebar whose own toggle and outside button
 *          both change the collapsed state and report it.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and a memory router; the theme CSS is not
 *           loaded, so classes and attributes are checked, not widths.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-162
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Sidebar } from "#src/routes/sidebar/sidebar";
import { SidebarRoute } from "#src/routes/sidebar/sidebar.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage(url = "/sidebar?scheme=dark&locale=ar") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <DesignSystemProvider colorScheme="light" locale="en">
        <PlaygroundIcons>
          <Sidebar />
        </PlaygroundIcons>
      </DesignSystemProvider>
    </MemoryRouter>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Sidebar page", () => {
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

  it("titles the page and the document, and sits at /sidebar under Navigation", () => {
    renderPage();
    expect(routePath(SidebarRoute)).toBe("/sidebar");
    expect(SidebarRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: "Sidebar" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Sidebar · Stackra Playground");
  });

  it("names every navigation landmark once", () => {
    renderPage();
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(names).toHaveLength(6);
    expect(new Set(names).size).toBe(names.length);
  });

  it("shows the expanded sidebar with its brand above and its account below", () => {
    renderPage();
    const expanded = section("Expanded");
    expect(expanded.getByText("Acme")).toBeTruthy();
    expect(expanded.getByText("Ada Lovelace")).toBeTruthy();
    expect(expanded.getByRole("button", { name: "Collapse sidebar" })).toBeTruthy();
    expect(expanded.getByRole("link", { name: "Home" }).getAttribute("href")).toBe(
      "/sidebar?scheme=dark&locale=ar#sidebar-expanded",
    );
  });

  it("shows the collapsed rail with the marks and an expand toggle", () => {
    renderPage();
    const rail = section("Collapsed");
    expect(rail.getByText("A")).toBeTruthy();
    expect(rail.getByRole("button", { name: "Expand sidebar" })).toBeTruthy();
    expect(rail.getByRole("link", { name: /^Orders\s*3$/ }).getAttribute("href")).toContain(
      "#sidebar-collapsed",
    );
  });

  it("marks the current place in the sidebar", () => {
    renderPage();
    expect(
      section("Current place and badges")
        .getByRole("link", { name: /^Orders\s*3$/ })
        .getAttribute("aria-current"),
    ).toBe("page");
  });

  it("leaves the toggle out when it is not collapsible", () => {
    renderPage();
    expect(section("Without the toggle").queryByRole("button")).toBeNull();
  });

  it("draws the Arabic sidebar in a right-to-left block", () => {
    renderPage();
    const sidebar = section("Arabic").getByRole("navigation", { name: "الشريط الجانبي" });
    expect(sidebar.closest("[dir='rtl']")?.getAttribute("lang")).toBe("ar");
  });

  it("changes the collapsed state from the toggle and from the outside button, and reports it", () => {
    renderPage();
    const live = section("Try it");
    expect(screen.getByTestId("sidebar-state").textContent).toBe("Sidebar: expanded");
    press(live.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByTestId("sidebar-state").textContent).toBe("Sidebar: collapsed");
    press(live.getByRole("button", { name: "Toggle from outside" }));
    expect(screen.getByTestId("sidebar-state").textContent).toBe("Sidebar: expanded");
    expect(live.getByRole("button", { name: "Collapse sidebar" })).toBeTruthy();
  });
});
