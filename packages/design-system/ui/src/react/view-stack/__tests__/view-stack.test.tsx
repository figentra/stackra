/**
 * Stackra file contract:
 * Purpose: proves the web `ViewStack` shows only the top view, pushes and pops through `useViewStack()` and
 *          `ViewStack.Back`, reports each move, moves focus to the view that appears, plays the entering frames where
 *          the browser has no View Transitions, plays a View Transition over the region's backdrop where it has one,
 *          and that `useViewStack()` refuses to run outside a stack.
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

  it("plays a View Transition over the region's backdrop where the browser has one", async () => {
    let finish: (() => void) | undefined;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const startViewTransition = vi.fn((update: () => void) => {
      update();
      return { ready: Promise.resolve(), finished };
    });
    Object.defineProperty(document, "startViewTransition", {
      value: startViewTransition,
      configurable: true,
    });
    // A see-through glass layer over an opaque page: the snapshot fill stacks the glass over the page colour.
    let isGlass = true;
    const colorOf = (element: Element) => {
      if (element.getAttribute("data-slot") === "view-stack")
        return isGlass ? "rgba(255, 255, 255, 0.5)" : "oklch(0.5 0.1 200 / 0%)";
      if (element.firstElementChild?.getAttribute("data-slot") === "view-stack")
        return "oklch(0.5 0.1 200 / 0%)";
      return "rgb(10, 20, 30)";
    };
    const real = window.getComputedStyle.bind(window);
    const computed = vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element) =>
        new Proxy(real(element), {
          get: (style, key) => {
            if (key === "backgroundColor") return colorOf(element);
            const value: unknown = Reflect.get(style, key);
            return typeof value === "function" ? value.bind(style) : value;
          },
        }),
    );
    const onViewChange = vi.fn();
    render(
      <DesignSystemContext value={{ resolvedMotion: "full" } as DesignSystemState}>
        <ViewStack defaultView="list" transition="push" onViewChange={onViewChange}>
          <ViewStack.View id="list" label="Orders">
            <Open />
          </ViewStack.View>
          <ViewStack.View id="details" label="Order 1042">
            <ViewStack.Back>Orders</ViewStack.Back>
          </ViewStack.View>
        </ViewStack>
      </DesignSystemContext>,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Open"));
      await Promise.resolve();
    });
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(onViewChange).toHaveBeenLastCalledWith("details");
    const pseudo = animate.mock.calls.map((call) => call[1]?.pseudoElement as string);
    expect(pseudo.some((name) => name.startsWith("::view-transition-old("))).toBe(true);
    const entering = animate.mock.calls.find((call) =>
      String(call[1]?.pseudoElement).startsWith("::view-transition-new("),
    )?.[0] as Keyframe[];
    expect(entering[0]).toMatchObject({
      backgroundColor: "rgb(10, 20, 30)",
      backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5))",
    });
    // Going back, the leaving view is drawn on top of the one it uncovers.
    isGlass = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Orders" }));
      await Promise.resolve();
    });
    const leaving = [...animate.mock.calls]
      .reverse()
      .find((call) =>
        String(call[1]?.pseudoElement).startsWith("::view-transition-old("),
      )?.[0] as Keyframe[];
    expect(leaving[0]).toMatchObject({ zIndex: "var(--z-pinned)", backgroundImage: "none" });
    await act(async () => {
      finish?.();
      await finished;
    });
    computed.mockRestore();
    Reflect.deleteProperty(document, "startViewTransition");
  });

  it("refuses useViewStack outside a stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Open />)).toThrow("needs a ViewStack");
  });
});
