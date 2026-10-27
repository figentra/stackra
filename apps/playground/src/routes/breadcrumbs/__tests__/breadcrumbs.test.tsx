/**
 * Stackra file contract:
 * Purpose: proves the breadcrumbs page titles the document, shows a trail whose last step is the current page, a single
 *          step, a long trail, a custom separator, press-only steps that are counted, a live trail that is cut back by
 *          a press and grows by the button, and an Arabic trail in a right-to-left block, each in its own named landmark.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and a memory router; the theme CSS is not
 *          loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-146
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Breadcrumbs } from "#src/routes/breadcrumbs/breadcrumbs";
import { BreadcrumbsRoute } from "#src/routes/breadcrumbs/breadcrumbs.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage(url = "/breadcrumbs?scheme=dark&locale=ar") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <DesignSystemProvider colorScheme="light" locale="en">
        <PlaygroundIcons>
          <Breadcrumbs />
        </PlaygroundIcons>
      </DesignSystemProvider>
    </MemoryRouter>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Breadcrumbs page", () => {
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

  it("titles the page and the document, and sits at /breadcrumbs under Navigation", () => {
    renderPage();
    expect(routePath(BreadcrumbsRoute)).toBe("/breadcrumbs");
    expect(BreadcrumbsRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: "Breadcrumbs" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Breadcrumbs · Stackra Playground");
  });

  it("names every navigation landmark once", () => {
    renderPage();
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(names.length).toBeGreaterThan(5);
    expect(new Set(names).size).toBe(names.length);
  });

  it("shows a trail whose links keep the scheme and language and whose last step is the current page", () => {
    renderPage();
    const trail = section("Trail");
    expect(trail.getByRole("link", { name: "Home" }).getAttribute("href")).toBe(
      "/breadcrumbs?scheme=dark&locale=ar#breadcrumbs-trail",
    );
    expect(trail.getAllByRole("link")).toHaveLength(3);
    expect(trail.getByText("Order 1042").closest("[aria-current='page']")).toBeTruthy();
  });

  it("shows a single step and a long trail", () => {
    renderPage();
    const lengths = section("Lengths");
    expect(
      within(lengths.getByRole("navigation", { name: "Single step" })).getAllByRole("listitem"),
    ).toHaveLength(1);
    expect(
      within(lengths.getByRole("navigation", { name: "Long trail" })).getAllByRole("listitem"),
    ).toHaveLength(5);
  });

  it("shows a custom separator between the steps", () => {
    renderPage();
    const trail = section("Separator").getByRole("navigation", { name: "Slash separator" });
    expect(trail.textContent).toContain("/");
  });

  it("counts the presses of the press-only steps", () => {
    renderPage();
    const steps = section("Press only");
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 0 times.");
    press(steps.getByRole("link", { name: "Home" }));
    press(steps.getByRole("link", { name: "Orders" }));
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 2 times.");
  });

  it("cuts the live trail back on a press and goes one level deeper by the button", () => {
    renderPage();
    const live = section("Try it");
    expect(screen.getByTestId("current-page").textContent).toBe("Current page: Invoice");
    expect(
      (live.getByRole("button", { name: "Go one level deeper" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    press(live.getByRole("link", { name: "Orders" }));
    expect(screen.getByTestId("current-page").textContent).toBe("Current page: Orders");
    expect(live.queryByRole("link", { name: "Order 1042" })).toBeNull();
    press(live.getByRole("button", { name: "Go one level deeper" }));
    expect(screen.getByTestId("current-page").textContent).toBe("Current page: Order 1042");
    press(live.getByRole("button", { name: "Back to the start" }));
    expect(screen.getByTestId("current-page").textContent).toBe("Current page: Home");
  });

  it("draws the Arabic trail in a right-to-left block", () => {
    renderPage();
    const trail = section("Arabic").getByRole("navigation", { name: "مسار الصفحة" });
    expect(trail.closest("[dir='rtl']")?.getAttribute("lang")).toBe("ar");
    expect(within(trail).getByText("الطلب 1042").closest("[aria-current='page']")).toBeTruthy();
  });
});
