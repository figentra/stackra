/**
 * Stackra file contract:
 * Purpose: proves the search field page titles the document, shows the labelled, described and name-only fields, both
 *          surfaces and full width, each state, and filters the live list after a short busy moment, reporting Enter
 *          and the clear button.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and fake timers for the simulated search;
 *          the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-074
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { SearchField } from "#src/routes/search-field/search-field";
import { SearchFieldRoute } from "#src/routes/search-field/search-field.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <SearchField />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Search field page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /search-field under Inputs", () => {
    renderPage();
    expect(routePath(SearchFieldRoute)).toBe("/search-field");
    expect(SearchFieldRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: "Search field" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Search field · Stackra Playground");
  });

  it("shows a labelled field, a described one and one named without a visible label", () => {
    renderPage();
    const basics = section("Basics");
    expect(basics.getByRole("searchbox", { name: "Search products" })).toBeTruthy();
    const described = basics.getByRole("searchbox", { name: "Search orders" });
    expect(described.getAttribute("aria-describedby")).toContain(
      basics.getByText("Search by order number, customer or date.").id,
    );
    expect(basics.getByRole("searchbox", { name: "Search the help centre" })).toBeTruthy();
  });

  it("shows both surfaces and a full-width field", () => {
    renderPage();
    expect(document.querySelectorAll(".search-field--primary")).not.toHaveLength(0);
    expect(document.querySelectorAll(".search-field--secondary")).toHaveLength(1);
    expect(document.querySelectorAll(".search-field--full-width")).toHaveLength(1);
  });

  it("shows each state of the field", () => {
    renderPage();
    const states = section("States");
    const box = (name: string) => states.getByRole<HTMLInputElement>("searchbox", { name });
    expect(box("With a value").value).toBe("Blue shirt");
    expect(box("Required").required).toBe(true);
    expect(box("Invalid").getAttribute("aria-invalid")).toBe("true");
    expect(states.getByText("Enter at least three characters.")).toBeTruthy();
    expect(box("Disabled").disabled).toBe(true);
    expect(box("Read-only").readOnly).toBe(true);
    expect(box("Loading").getAttribute("aria-busy")).toBe("true");
  });

  it("filters the list after a busy moment, and reports Enter and the clear button", () => {
    renderPage();
    const live = section("Try it");
    const input = live.getByRole<HTMLInputElement>("searchbox", { name: "Find a product" });
    expect(live.getAllByRole("listitem")).toHaveLength(8);

    fireEvent.change(input, { target: { value: "lamp" } });
    expect(input.getAttribute("aria-busy")).toBe("true");
    expect(live.getAllByRole("listitem")).toHaveLength(8);
    act(() => vi.advanceTimersByTime(400));
    expect(input.hasAttribute("aria-busy")).toBe(false);
    expect(live.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Desk lamp",
      "Floor lamp",
    ]);
    expect(live.getByRole("status").textContent).toBe("2 products found.");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(live.getByText("Submitted: lamp")).toBeTruthy();

    act(() => live.getByRole("button", { name: "Clear the product search" }).click());
    expect(input.value).toBe("");
    expect(live.getByText("Cleared the search.")).toBeTruthy();
    act(() => vi.advanceTimersByTime(400));
    expect(live.getAllByRole("listitem")).toHaveLength(8);
  });
});
