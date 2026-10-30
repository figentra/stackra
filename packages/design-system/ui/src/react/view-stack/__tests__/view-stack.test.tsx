/**
 * Stackra file contract:
 * Purpose: proves the web `ViewStack` shows only the top view, pushes and pops through `useViewStack()` and
 *          `ViewStack.Back`, reports each move, moves focus to the view that appears, plays the entering frames where
 *          the browser has no View Transitions, and that `useViewStack()` refuses to run outside a stack.
 * Boundary: jsdom with real HeroUI; jsdom has neither View Transitions nor `Element.animate`, so `animate` is a spy.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); WCAG 2.2 SC 2.4.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useViewStack } from "#react/view-stack/use-view-stack";
import { ViewStack } from "#react/view-stack/view-stack";

/** Opens the details view. */
function Open() {
  const { push } = useViewStack();
  return (
    <button type="button" onClick={() => push("details")}>
      Open
    </button>
  );
}

describe("ViewStack (web)", () => {
  const animate = vi.fn();
  beforeEach(() => {
    animate.mockClear();
    Element.prototype.animate = animate as unknown as Element["animate"];
  });

  it("pushes, pops, reports and focuses the view that appears", () => {
    const onViewChange = vi.fn();
    render(
      <DesignSystemContext
        value={{ direction: "rtl", resolvedMotion: "full" } as DesignSystemState}
      >
        <ViewStack defaultView="list" onViewChange={onViewChange}>
          <ViewStack.View id="list" label="Orders">
            <Open />
          </ViewStack.View>
          <ViewStack.View id="details" label="Order 1042">
            <ViewStack.Back>Orders</ViewStack.Back>
          </ViewStack.View>
        </ViewStack>
      </DesignSystemContext>,
    );
    expect(screen.queryByRole("region", { name: "Order 1042" })).toBeNull();
    act(() => fireEvent.click(screen.getByText("Open")));
    const details = screen.getByRole("region", { name: "Order 1042" });
    expect(document.activeElement).toBe(details);
    expect(onViewChange).toHaveBeenLastCalledWith("details");
    // Right to left: the push comes in from the left.
    expect(animate.mock.lastCall?.[0]?.[0]).toEqual({ transform: "translateX(-100%)" });
    act(() => fireEvent.click(screen.getByRole("button", { name: "Orders" })));
    expect(screen.getByRole("region", { name: "Orders" })).toBeTruthy();
    expect(onViewChange).toHaveBeenLastCalledWith("list");
    expect(screen.queryByRole("button", { name: "Orders" })).toBeNull();
  });

  it("plays nothing at the none level", () => {
    render(
      <DesignSystemContext value={{ resolvedMotion: "none" } as DesignSystemState}>
        <ViewStack defaultView="list">
          <ViewStack.View id="list" label="Orders">
            <Open />
          </ViewStack.View>
          <ViewStack.View id="details" label="Order 1042">
            x
          </ViewStack.View>
        </ViewStack>
      </DesignSystemContext>,
    );
    act(() => fireEvent.click(screen.getByText("Open")));
    expect(screen.getByRole("region", { name: "Order 1042" })).toBeTruthy();
    expect(animate).not.toHaveBeenCalled();
  });

  it("refuses useViewStack outside a stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Open />)).toThrow("needs a ViewStack");
  });
});
