/**
 * Stackra file contract:
 * Purpose: proves the page header page opens with a PageHeader that is the page's one `h1`, draws each part alone and
 *          the sample with a trail (one Breadcrumbs landmark), the actions (one, three, and six with three in the menu,
 *          a danger and a disabled one, a link action), the Arabic header in a right-to-left block, and the live header:
 *          the primary action changes the status and its own label, and the menu's choice is reported.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded. A role query
 *           finds nothing outside an open menu (React Aria hides the page behind it), so each case holds what it needs
 *           before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-168
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { PageHeader } from "#src/routes/page-header/page-header";
import { PageHeaderRoute } from "#src/routes/page-header/page-header.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <PageHeader />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Page header page", () => {
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

  it("opens with a page header that is the page's one h1, and sits at /page-header under Layout", () => {
    renderPage();
    expect(routePath(PageHeaderRoute)).toBe("/page-header");
    expect(PageHeaderRoute.category).toBe("Layout");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1, name: "Page header" });
    expect(h1.closest("header")).toBeTruthy();
    expect(document.title).toBe("Page header · Stackra Playground");
  });

  it("draws every sample as a level-3 heading, skipping no level", () => {
    renderPage();
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
    expect(document.querySelectorAll("#page-header-parts ~ ul h3")).toHaveLength(5);
    expect(document.querySelectorAll("#page-header-actions ~ ul h3")).toHaveLength(5);
  });

  it("holds one trail, in the sample with every part", () => {
    renderPage();
    const trail = screen.getByRole("navigation", { name: "Breadcrumbs" });
    // React Aria draws the current step as a disabled link with no href, so two steps lead anywhere.
    const links = within(trail).getAllByRole("link");
    expect(links.filter((link) => link.hasAttribute("href"))).toHaveLength(2);
    expect(links.at(-1)?.getAttribute("aria-current")).toBe("page");
    expect(section("Parts").getByRole("navigation", { name: "Breadcrumbs" })).toBe(trail);
  });

  it("shows a status beside a title, and one with a start slot", () => {
    renderPage();
    const parts = section("Parts");
    expect(parts.getAllByText("Paid")).toHaveLength(2);
    const withStart = document.querySelectorAll("#page-header-parts ~ ul > li")[3] as HTMLElement;
    expect(within(withStart).getByText("AL")).toBeTruthy();
  });

  it("draws six actions as three buttons and a menu of three", () => {
    renderPage();
    const six = document.querySelectorAll("#page-header-actions ~ ul > li")[2] as HTMLElement;
    expect(
      within(six)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Create order", "Edit", "Export", ""]);
    press(within(six).getByRole("button", { name: "More actions for this order" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Duplicate",
      "Print",
      "Archive",
    ]);
  });

  it("draws a disabled action as a disabled button and a link action as a link", () => {
    renderPage();
    const actions = section("Actions");
    expect(actions.getByRole<HTMLButtonElement>("button", { name: "Archive" }).disabled).toBe(true);
    expect(actions.getByRole("link", { name: "Open the app header" }).getAttribute("href")).toBe(
      "/app-header",
    );
  });

  it("draws the Arabic header in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = document.querySelector("[data-sample='arabic']") as HTMLElement;
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(within(block).getByRole("heading", { level: 3, name: "الطلب 1042" })).toBeTruthy();
    expect(within(block).getByRole("button", { name: "تعديل" })).toBeTruthy();
  });

  it("changes the status and the primary label, and reports the menu's choice", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Paid")).toBeTruthy();
    expect(live.getByRole("status").textContent).toBe("No action chosen.");

    press(live.getByRole("button", { name: "Mark as shipped" }));
    expect(live.getByText("Shipped")).toBeTruthy();
    expect(live.getByRole("button", { name: "Undo shipping" })).toBeTruthy();

    press(live.getByRole("button", { name: "Export" }));
    expect(live.getByRole("status").textContent).toBe("Action chosen: Export.");

    press(live.getByRole("button", { name: "More actions for this order" }));
    press(screen.getByRole("menuitem", { name: "Print" }));
    expect(live.getByRole("status").textContent).toBe("Action chosen: Print.");
  });
});
