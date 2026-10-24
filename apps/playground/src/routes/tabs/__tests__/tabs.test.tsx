/**
 * Stackra file contract:
 * Purpose: proves the tabs page titles the document, shows the named and unnamed tab lists, both variants, both
 *          orientations, a disabled tab and a disabled list, the empty state and the named loading spinner, and a live
 *          list whose selection the page holds, reports and moves from outside.
 * Boundary: jsdom inside the DesignSystemProvider with stubbed matchMedia and ResizeObserver and no Web Animations; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-139
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Tabs } from "#src/routes/tabs/tabs";
import { TabsRoute } from "#src/routes/tabs/tabs.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Tabs />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const selectedIn = (list: HTMLElement) =>
  [...list.querySelectorAll('[role="tab"][aria-selected="true"]')].map((tab) => tab.textContent);

/** Watches nothing: jsdom has no layout, and the tab list's scroll shadow only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe("Tabs page", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    // jsdom has no Web Animations; the selected-tab indicator asks the element for its running ones.
    Object.defineProperty(Element.prototype, "getAnimations", {
      value: () => [],
      configurable: true,
    });
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "getAnimations");
  });

  it("titles the page and the document, and sits at /tabs under Navigation", () => {
    renderPage();
    expect(TabsRoute.path).toBe("/tabs");
    expect(TabsRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: "Tabs" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Tabs · Stackra Playground");
  });

  it("shows a named tab list and one with no name, each on its first tab", () => {
    renderPage();
    const basics = section("Basics");
    expect(selectedIn(basics.getByRole("tablist", { name: "Order sections" }))).toEqual([
      "Overview",
    ]);
    expect(basics.getAllByRole("tablist")).toHaveLength(2);
  });

  it("shows both variants and both orientations", () => {
    renderPage();
    const variants = section("Variants");
    expect(variants.getByRole("tablist", { name: "Primary tabs" })).toBeTruthy();
    expect(
      variants
        .getByRole("tablist", { name: "Secondary tabs" })
        .closest('[data-slot="tabs"]')
        ?.classList.contains("tabs--secondary"),
    ).toBe(true);
    const orientation = section("Orientation");
    expect(
      orientation
        .getByRole("tablist", { name: "Horizontal tabs" })
        .getAttribute("aria-orientation"),
    ).toBe("horizontal");
    expect(
      orientation.getByRole("tablist", { name: "Vertical tabs" }).getAttribute("aria-orientation"),
    ).toBe("vertical");
  });

  it("shows a refused tab and a disabled list", () => {
    renderPage();
    const states = section("States");
    expect(
      within(states.getByRole("tablist", { name: "One disabled tab" }))
        .getByRole("tab", { name: "Items" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
    for (const tab of within(states.getByRole("tablist", { name: "Disabled tabs" })).getAllByRole(
      "tab",
    )) {
      expect(tab.getAttribute("aria-disabled")).toBe("true");
    }
  });

  it("shows the empty state and the named loading spinner", () => {
    renderPage();
    const empty = section("Empty and loading");
    expect(empty.getByText("No sections yet.")).toBeTruthy();
    expect(empty.getByLabelText("Loading sections")).toBeTruthy();
  });

  it("holds the live selection, reports it and moves it from outside", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Selected: overview")).toBeTruthy();
    press(live.getByRole("tab", { name: "Items" }));
    expect(live.getByText("Selected: items")).toBeTruthy();
    expect(live.getByRole("tabpanel", { name: "Items" })).toBeTruthy();
    press(live.getByRole("button", { name: "Show history" }));
    expect(live.getByText("Selected: history")).toBeTruthy();
    expect(selectedIn(live.getByRole("tablist", { name: "Controlled tabs" }))).toEqual(["History"]);
  });
});
