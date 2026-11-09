/**
 * Stackra file contract:
 * Purpose: proves the StepSwitcher is a tab list named by its label with one step per tab, shows the first step's
 *          title (an `h4`, one level under a station's `h3`, or the level given), line and code in a schematic window
 *          titled by its file, moves and selects with the arrow keys (mirrored in Arabic), draws a single step with
 *          no tabs, and shows every step whole below the full motion level.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia, ResizeObserver and Web Animations are
 *           stand-ins, and the locale and the motion level come from `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { StepSwitcher } from "#react/step-switcher/step-switcher";
import type { StepSwitcherProps } from "#react/step-switcher/step-switcher.props";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

/** Watches nothing: jsdom has no layout, and the tab list only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

const STEPS: StepSwitcherProps["steps"] = [
  {
    id: "action",
    label: "Action",
    title: "Write the action",
    body: "A typed, authorised class.",
    code: {
      filename: "cancel-order.action.ts",
      language: "ts",
      source: "export class CancelOrder {}",
    },
  },
  {
    id: "endpoint",
    label: "Endpoint",
    title: "Gen writes the route",
    body: "Never hand-written.",
    code: { filename: "routes.ts", language: "ts", source: "PUT /orders/:orderId/cancel" },
  },
];

const tab = (name: string) => screen.getByRole("tab", { name });
const key = (element: HTMLElement, pressed: string) => {
  act(() => element.focus());
  fireEvent.keyDown(element, { key: pressed });
};

describe("StepSwitcher", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    // jsdom has no Web Animations; the tabs ask an element for its running ones.
    Object.defineProperty(Element.prototype, "getAnimations", {
      value: () => [],
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(Element.prototype, "getAnimations");
  });

  it("is a named tab list showing the first step's words and code in its schematic window", () => {
    const { container } = render(<StepSwitcher label="Write it once" steps={STEPS} />);
    expect(screen.getByRole("tablist", { name: "Write it once" })).toBeTruthy();
    expect(screen.getAllByRole("tab").map((each) => each.textContent)).toEqual([
      "Action",
      "Endpoint",
    ]);
    const panel = screen.getByRole("tabpanel");
    expect(panel.textContent).toContain("Write the action");
    expect(panel.textContent).toContain("A typed, authorised class.");
    expect(panel.textContent).toContain("export class CancelOrder {}");
    const frame = container.querySelector('[data-slot="frame"]');
    expect(frame?.getAttribute("data-variant")).toBe("schematic");
    expect(frame?.textContent).toContain("cancel-order.action.ts");
    expect(screen.getByRole("heading", { level: 4 }).textContent).toBe("Write the action");
  });

  it("puts the step's title at the level given", () => {
    render(<StepSwitcher label="Write it once" steps={STEPS} headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Write the action");
  });

  it("draws a single step with no tabs, only its words and window", () => {
    const { container } = render(<StepSwitcher label="Expose" steps={STEPS.slice(1)} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("heading", { level: 4 }).textContent).toBe("Gen writes the route");
    expect(container.querySelector('[data-slot="frame"]')?.textContent).toContain("routes.ts");
  });

  it("moves and selects with the arrow keys", () => {
    render(<StepSwitcher label="Write it once" steps={STEPS} />);
    key(tab("Action"), "ArrowRight");
    expect(tab("Endpoint").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toContain("Gen writes the route");
  });

  it("mirrors the arrow keys in Arabic", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <StepSwitcher label="اكتبه مرة واحدة" steps={STEPS} />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    key(tab("Action"), "ArrowLeft");
    expect(tab("Endpoint").getAttribute("aria-selected")).toBe("true");
  });

  it("shows the selected step whole below the full motion level", () => {
    render(
      <DesignSystemProvider motion="none" hasShortcutCheatSheet={false}>
        <StepSwitcher label="Write it once" steps={STEPS} />
      </DesignSystemProvider>,
    );
    act(() => tab("Endpoint").click());
    expect(screen.getByRole("tabpanel").textContent).toContain("PUT /orders/:orderId/cancel");
  });
});
