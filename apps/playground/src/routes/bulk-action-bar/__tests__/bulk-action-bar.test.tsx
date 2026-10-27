/**
 * Stackra file contract:
 * Purpose: proves the bulk action bar page titles the document, shows the bar for one and several selected records and
 *          draws nothing for none, shows one, three and a disabled action, offers select all matching and lets the page
 *          choose and release it, and runs a live example where a slow action shows itself busy and then clears the
 *          selection, a failing action leaves the selection as it was, a checkbox changes the count and clearing moves
 *          focus on to the example.
 * Boundary: jsdom inside the DesignSystemProvider with stubbed matchMedia; the theme CSS is not loaded, so looks are
 *           not checked. The fake actions' delays run on fake timers, which each test that needs them advances by hand.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-193
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { BulkActionBar } from "#src/routes/bulk-action-bar/bulk-action-bar";
import { BulkActionBarRoute } from "#src/routes/bulk-action-bar/bulk-action-bar.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <BulkActionBar />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe("BulkActionBar page", () => {
  beforeEach(() => {
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

  it("titles the page and the document, and sits at /bulk-action-bar under Data display", () => {
    renderPage();
    expect(routePath(BulkActionBarRoute)).toBe("/bulk-action-bar");
    expect(BulkActionBarRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: "Bulk action bar" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Bulk action bar · Stackra Playground");
  });

  it("shows the bar for one and several selected, and nothing for none", () => {
    renderPage();
    const counts = section("Counts");
    const one = counts.getByRole("toolbar", { name: "Actions, One selected" });
    expect(within(one).getByText("1 selected")).toBeTruthy();
    const several = counts.getByRole("toolbar", { name: "Actions, Three selected" });
    expect(within(several).getByText("3 selected")).toBeTruthy();
    expect(counts.queryByRole("toolbar", { name: "Actions, Nothing selected" })).toBeNull();
  });

  it("shows one, three and a disabled action", () => {
    renderPage();
    const actions = section("Actions");
    const buttons = (name: string) =>
      within(actions.getByRole("toolbar", { name }))
        .getAllByRole("button")
        .map((button) => button.textContent);
    expect(buttons("Actions, One action")).toEqual(["Archive", "Clear selection"]);
    expect(buttons("Actions, Three actions")).toEqual([
      "Archive",
      "Export",
      "Delete",
      "Clear selection",
    ]);
    const refund = actions.getByRole("button", { name: "Refund: Paid orders stay" });
    expect((refund as HTMLButtonElement).disabled).toBe(true);
  });

  it("offers select all matching, and the page chooses and releases it", () => {
    renderPage();
    const matching = section("Select all matching");
    press(matching.getByRole("button", { name: "Select all 245" }));
    expect(matching.getAllByText("245 selected", { selector: "p" })).toHaveLength(2);
    press(matching.getAllByRole("button", { name: "Select only the 20 shown" })[0] as HTMLElement);
    expect(matching.queryAllByRole("button", { name: "Select all 245" })).toHaveLength(1);
  });

  describe("the live example", () => {
    it("starts with two selected, and a checkbox changes the count", () => {
      renderPage();
      const live = section("Try it");
      expect(live.getByTestId("bulk-action-bar-selected").textContent).toBe(
        "Selected: ord-1002, ord-1003",
      );
      expect(within(live.getByRole("toolbar")).getByText("2 selected")).toBeTruthy();
      press(live.getByRole("checkbox", { name: "Order #1005" }));
      expect(within(live.getByRole("toolbar")).getByText("3 selected")).toBeTruthy();
    });

    it("shows the slow action busy, then clears the selection and the bar", async () => {
      vi.useFakeTimers();
      renderPage();
      const live = section("Try it");
      const archive = live.getByRole("button", { name: "Archive" });
      press(archive);
      expect(archive.hasAttribute("data-pending")).toBe(true);
      expect(live.getByTestId("bulk-action-bar-last").textContent).toBe(
        "Last action: Archive running",
      );
      await advance(1000);
      expect(live.getByTestId("bulk-action-bar-selected").textContent).toBe("Selected: none");
      expect(live.queryByRole("toolbar")).toBeNull();
    });

    it("leaves the selection as it was when an action fails", async () => {
      vi.useFakeTimers();
      renderPage();
      const live = section("Try it");
      press(live.getByRole("button", { name: "Delete" }));
      await advance(1000);
      expect(live.getByTestId("bulk-action-bar-last").textContent).toBe(
        "Last action: Delete failed",
      );
      expect(live.getByTestId("bulk-action-bar-selected").textContent).toBe(
        "Selected: ord-1002, ord-1003",
      );
      expect(live.getByRole("toolbar")).toBeTruthy();
    });

    it("moves focus to the example when the selection is cleared", () => {
      renderPage();
      const live = section("Try it");
      press(live.getByRole("button", { name: "Clear selection" }));
      expect(live.queryByRole("toolbar")).toBeNull();
      expect(document.activeElement).toBe(live.getByTestId("bulk-action-bar-live"));
    });
  });
});
