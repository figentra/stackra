/**
 * Stackra file contract:
 * Purpose: proves the empty state page titles the document, shows one state per reason with its own heading and
 *          action, the four parts (title only, an action, an icon of its own, none), and a live order list that turns
 *          into the no-results state when the search matches nothing and back again when it is cleared.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1 and 4.1.3; ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-151
import { EmptyReason } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { EmptyState } from "#src/routes/empty-state/empty-state";
import { EmptyStateRoute } from "#src/routes/empty-state/empty-state.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <EmptyState />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Empty state page", () => {
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

  it("titles the page and the document, and sits at /empty-state under Feedback and status", () => {
    renderPage();
    expect(routePath(EmptyStateRoute)).toBe("/empty-state");
    expect(EmptyStateRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: "Empty state" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Empty state · Stackra Playground");
  });

  it("shows one state per reason, each with its own heading", () => {
    renderPage();
    const reasons = section("Reasons");
    expect(document.querySelectorAll("#empty-state-reasons ~ ul [data-reason]")).toHaveLength(
      EmptyReason.length,
    );
    for (const name of ["No orders yet", "No orders match your filters", "You cannot see orders"])
      expect(reasons.getByRole("heading", { level: 3, name })).toBeTruthy();
    expect(reasons.getAllByRole("button")).toHaveLength(2);
  });

  it("shows the parts: title only, an action, an icon of its own and none", () => {
    renderPage();
    const parts = section("Parts");
    const states = [
      ...document.querySelectorAll<HTMLElement>("#empty-state-parts ~ ul [data-reason]"),
    ];
    expect(states).toHaveLength(4);
    const [titleOnly, withAction, ownIcon, noIcon] = states;
    expect(titleOnly?.querySelector("p")).toBeNull();
    expect(within(withAction as HTMLElement).getAllByRole("button")).toHaveLength(2);
    expect(parts.getByRole("button", { name: "Request access" })).toBeTruthy();
    expect(ownIcon?.querySelector("svg")).toBeTruthy();
    expect(noIcon?.querySelector('[data-slot="state-icon"]')).toBeNull();
  });

  it("turns the list into the no-results state and back, announcing the count", () => {
    renderPage();
    const live = section("Try it");
    const input = live.getByRole<HTMLInputElement>("searchbox", { name: "Search orders" });
    expect(live.getAllByRole("listitem")).toHaveLength(4);
    expect(live.getByRole("status").textContent).toBe("4 orders shown.");

    fireEvent.change(input, { target: { value: "zzz" } });
    expect(live.queryAllByRole("listitem")).toHaveLength(0);
    expect(
      live.getByRole("heading", { level: 3, name: "No orders match your filters" }),
    ).toBeTruthy();
    expect(live.getByRole("status").textContent).toBe("No orders match.");

    act(() => live.getByRole("button", { name: "Show all orders" }).click());
    expect(input.value).toBe("");
    expect(live.getAllByRole("listitem")).toHaveLength(4);
  });

  it("narrows the list to the orders that match", () => {
    renderPage();
    const live = section("Try it");
    fireEvent.change(live.getByRole("searchbox", { name: "Search orders" }), {
      target: { value: "refund" },
    });
    expect(live.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Order 1044 · Alan Turing · refunded",
    ]);
    expect(live.getByRole("status").textContent).toBe("1 order shown.");
  });
});
