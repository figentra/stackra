/**
 * Stackra file contract:
 * Purpose: proves the filter bar page titles the document, lists the kinds of filter, shows the chips of filters applied
 *          from the start with their values and the query written under each bar, shows a bar with every filter applied
 *          (its add button disabled), refuses a disabled filter in the add-filter menu, and narrows the live list of
 *          orders by the search text and by a filter removed again, reading the count out politely.
 * Boundary: jsdom inside the DesignSystemProvider and the playground's icon registry, with a stubbed matchMedia; the
 *           theme CSS is not loaded, so looks are not checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-197
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { FilterBar } from "#src/routes/filter-bar/filter-bar";
import { FilterBarRoute } from "#src/routes/filter-bar/filter-bar.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <FilterBar />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
/** The text of every polite status in a section: the bar's own count of filters, and the page's count of orders. */
const statusesOf = (scope: ReturnType<typeof section>) =>
  scope.getAllByRole("status").map((status) => status.textContent);
const press = (element: HTMLElement) => act(() => element.click());

describe("Filter bar page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    // jsdom has no layout, and the menu scrolls the focused item into view on a timer, which would throw late.
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("titles the page and the document, and sits at /filter-bar under Data", () => {
    renderPage();
    expect(FilterBarRoute.path).toBe("/filter-bar");
    expect(FilterBarRoute.category).toBe("Data");
    expect(screen.getByRole("heading", { level: 1, name: "Filter bar" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Filter bar · Stackra Playground");
  });

  it("names every bar's landmark differently, so a screen reader can tell them apart", () => {
    renderPage();
    const names = screen.getAllByRole("search").map((bar) => bar.getAttribute("aria-label"));
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(5);
  });

  it("lists the six kinds of filter with the editor and value of each", () => {
    renderPage();
    const items = section("Kinds of filter").getAllByRole("listitem");
    expect(items).toHaveLength(6);
    expect(items[5]?.textContent).toContain("Boolean: yes or no; holds true or false.");
  });

  it("starts a bar empty, and offers every filter in its add-filter menu", () => {
    renderPage();
    const basics = section("Basics");
    expect(basics.getByTestId("filter-bar-basics-query").textContent).toBe("Query: none");
    press(basics.getByRole("button", { name: "Add filter" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Status",
      "Region",
      "Customer",
      "Total",
      "Placed",
      "Gift order",
    ]);
  });

  it("shows the filters applied from the start as chips with their values, and the query", () => {
    renderPage();
    const states = section("States");
    expect(states.getByRole("button", { name: "Status: Paid" })).toBeTruthy();
    expect(states.getByRole("button", { name: "Region: Europe, United States" })).toBeTruthy();
    expect(states.getByRole("button", { name: /^Total: ≥/ })).toBeTruthy();
    expect(states.getByTestId("filter-bar-applied-query").textContent).toBe(
      "Query: status=paid; region=eu,us; total=20..",
    );
  });

  it("refuses a disabled filter in the menu, and disables the add button when every filter is applied", () => {
    renderPage();
    const states = section("States");
    const addButtons = states.getAllByRole<HTMLButtonElement>("button", { name: "Add filter" });
    expect(addButtons.map((button) => button.disabled)).toEqual([false, false, true]);
    press(addButtons[1] as HTMLButtonElement);
    expect(screen.getByRole("menuitem", { name: "Total" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(
      screen.getByRole("menuitem", { name: "Status" }).getAttribute("aria-disabled"),
    ).toBeNull();
  });

  it("narrows the live list by the search text and again when a filter is removed", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getAllByRole("listitem")).toHaveLength(12);
    expect(statusesOf(live)).toContain("12 orders match.");

    fireEvent.change(live.getByRole("searchbox", { name: "Search the live orders" }), {
      target: { value: "ada" },
    });
    expect(live.getAllByRole("listitem")).toHaveLength(3);
    expect(live.getByTestId("filter-bar-live-query").textContent).toBe("Query: search=ada");
    expect(live.getByRole("button", { name: "Clear all" })).toBeTruthy();

    press(live.getByRole("button", { name: "Clear all" }));
    expect(live.getAllByRole("listitem")).toHaveLength(12);
    expect(live.getByTestId("filter-bar-live-query").textContent).toBe("Query: none");
  });

  it("says so when nothing matches", () => {
    renderPage();
    const live = section("Try it");
    fireEvent.change(live.getByRole("searchbox", { name: "Search the live orders" }), {
      target: { value: "zzz" },
    });
    expect(statusesOf(live)).toContain("No order matches. Clear a filter to see more.");
    expect(live.queryAllByRole("listitem")).toHaveLength(0);
  });
});
