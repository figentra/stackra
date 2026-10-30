/**
 * Stackra file contract:
 * Purpose: proves the web Tabs is a named tab list with one tab per item and the selected one's panel only, selects the
 *          first tab that is not disabled by default, reports the selection as a list of one id (controlled or not),
 *          moves and selects with the arrow, Home and End keys while skipping a disabled tab, refuses a disabled tab and
 *          a disabled list from the pointer and the keyboard, lays out by `orientation` and `variant`, shows the empty
 *          state or a named busy spinner when there are no tabs, passes unknown props and the ref through, and refuses
 *          HeroUI's `selectedKey`, children and a selection mode.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-135
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { TabsContractProps } from "#contracts/types/tabs-contract-props.type";
import { Tabs } from "#react/tabs/tabs";
import type { TabsProps } from "#react/tabs/tabs.props";

const ITEMS = [
  { id: "details", label: "Details", content: "Order details", isDisabled: true },
  { id: "items", label: "Items", content: "Order items" },
  { id: "history", label: "History", content: "Order history" },
  { id: "notes", label: "Notes", content: "Order notes" },
] as const;

const press = (element: HTMLElement) => act(() => element.click());
const tab = (name: string) => screen.getByRole("tab", { name });
const selected = () =>
  screen
    .getAllByRole("tab")
    .filter((each) => each.getAttribute("aria-selected") === "true")
    .map((each) => each.textContent);
const key = (element: HTMLElement, pressed: string) => {
  act(() => element.focus());
  fireEvent.keyDown(element, { key: pressed });
};

/** Watches nothing: jsdom has no layout, and the tab list's scroll shadow only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe("Tabs (web)", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    // jsdom has no Web Animations; the selected-tab indicator asks the element for its running ones.
    Object.defineProperty(Element.prototype, "getAnimations", {
      value: () => [],
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "getAnimations");
  });

  it("is a tab list named by its label, with one tab per item in order", () => {
    render(<Tabs items={ITEMS} label="Order sections" />);
    expect(screen.getByRole("tablist", { name: "Order sections" })).toBeTruthy();
    expect(screen.getAllByRole("tab").map((each) => each.textContent)).toEqual([
      "Details",
      "Items",
      "History",
      "Notes",
    ]);
  });

  it("selects the first tab that is not disabled and shows only its panel", () => {
    render(<Tabs items={ITEMS} label="Order sections" />);
    expect(selected()).toEqual(["Items"]);
    const panel = screen.getByRole("tabpanel", { name: "Items" });
    expect(panel.textContent).toBe("Order items");
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("selects another tab on a press and reports it as a list of one id", () => {
    const onSelectionChange = vi.fn();
    render(<Tabs items={ITEMS} label="Order sections" onSelectionChange={onSelectionChange} />);
    press(tab("History"));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["history"]);
    expect(selected()).toEqual(["History"]);
    expect(screen.getByRole("tabpanel", { name: "History" }).textContent).toBe("Order history");
  });

  it("starts from `defaultSelectedKeys`", () => {
    render(<Tabs items={ITEMS} label="Order sections" defaultSelectedKeys={["notes"]} />);
    expect(selected()).toEqual(["Notes"]);
  });

  it("follows `selectedKeys` when controlled", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Tabs
        items={ITEMS}
        label="Order sections"
        selectedKeys={["items"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    press(tab("Notes"));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["notes"]);
    expect(selected()).toEqual(["Items"]);
    rerender(
      <Tabs
        items={ITEMS}
        label="Order sections"
        selectedKeys={["notes"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(selected()).toEqual(["Notes"]);
  });

  it("moves and selects with the arrow keys, wrapping and skipping a disabled tab", () => {
    const onSelectionChange = vi.fn();
    render(<Tabs items={ITEMS} label="Order sections" onSelectionChange={onSelectionChange} />);
    key(tab("Items"), "ArrowRight");
    expect(selected()).toEqual(["History"]);
    key(tab("History"), "ArrowRight");
    expect(selected()).toEqual(["Notes"]);
    key(tab("Notes"), "ArrowRight");
    // Past the last tab it wraps to the first one that can be used, never to the disabled "Details".
    expect(selected()).toEqual(["Items"]);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["items"]);
  });

  it("jumps to the ends with Home and End", () => {
    render(<Tabs items={ITEMS} label="Order sections" defaultSelectedKeys={["history"]} />);
    key(tab("History"), "End");
    expect(selected()).toEqual(["Notes"]);
    key(tab("Notes"), "Home");
    expect(selected()).toEqual(["Items"]);
  });

  it("refuses a disabled tab from the pointer", () => {
    const onSelectionChange = vi.fn();
    render(<Tabs items={ITEMS} label="Order sections" onSelectionChange={onSelectionChange} />);
    expect(tab("Details").getAttribute("aria-disabled")).toBe("true");
    // React Aria reports the first usable tab it selects on its own; only what the press adds is asked about.
    onSelectionChange.mockClear();
    press(tab("Details"));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(selected()).toEqual(["Items"]);
  });

  it("refuses every tab from the pointer and the keyboard while disabled", () => {
    const onSelectionChange = vi.fn();
    render(
      <Tabs
        items={ITEMS}
        label="Order sections"
        isDisabled
        defaultSelectedKeys={["items"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    for (const each of screen.getAllByRole("tab")) {
      expect(each.getAttribute("aria-disabled")).toBe("true");
    }
    press(tab("Notes"));
    // A disabled tab takes no focus, so no key can reach the list from it.
    act(() => tab("Items").focus());
    expect(document.activeElement).not.toBe(tab("Items"));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(selected()).toEqual(["Items"]);
  });

  it("is horizontal by default and vertical when told", () => {
    const { rerender } = render(<Tabs items={ITEMS} label="Order sections" />);
    expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("horizontal");
    rerender(<Tabs items={ITEMS} label="Order sections" orientation="vertical" />);
    expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("vertical");
  });

  it("draws HeroUI's secondary variant only when asked", () => {
    const { container, rerender } = render(<Tabs items={ITEMS} label="Order sections" />);
    const root = () => container.querySelector('[data-slot="tabs"]');
    expect(root()?.classList.contains("tabs--secondary")).toBe(false);
    rerender(<Tabs items={ITEMS} label="Order sections" variant="secondary" />);
    expect(root()?.classList.contains("tabs--secondary")).toBe(true);
  });

  it("shows the empty state when there are no tabs, and nothing without one", () => {
    const { container, rerender } = render(
      <Tabs items={[]} label="Order sections" emptyState={<p>No sections yet</p>} />,
    );
    expect(screen.getByText("No sections yet")).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    rerender(<Tabs items={[]} label="Order sections" />);
    expect(container.textContent).toBe("");
  });

  it("shows one named busy spinner, not the empty state, while loading with no tabs", () => {
    const { container } = render(
      <Tabs
        items={[]}
        isLoading
        loadingLabel="Loading sections"
        emptyState={<p>No sections yet</p>}
      />,
    );
    expect(screen.queryByText("No sections yet")).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.getByLabelText("Loading sections")).toBeTruthy();
  });

  it("leaves the tabs usable while loading once they exist", () => {
    render(<Tabs items={ITEMS} label="Order sections" isLoading loadingLabel="Loading" />);
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });

  it("passes unknown props and the ref through", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Tabs ref={ref} items={ITEMS} label="Order sections" data-testid="tabs" className="mine" />,
    );
    const root = container.querySelector('[data-slot="tabs"]');
    expect(root?.getAttribute("data-testid")).toBe("tabs");
    expect(root?.classList.contains("mine")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses HeroUI's selection, children and a selection mode", () => {
    expectTypeOf<TabsProps>().toExtend<TabsContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the selection is `selectedKeys`, a list of ids
    void (<Tabs items={ITEMS} selectedKey="items" />);
    // @ts-expect-error tabs are `items`, never children
    void (<Tabs items={ITEMS}>x</Tabs>);
    // @ts-expect-error a tab list always holds exactly one tab
    void (<Tabs items={ITEMS} selectionMode="multiple" />);
  });

  it("glides the indicator on the shared spring at the full motion level", () => {
    const { container } = render(<Tabs items={ITEMS} label="Order sections" />);
    const indicator = container.querySelector<HTMLElement>(
      '[data-slot="tabs-indicator"], .tabs__indicator',
    );
    expect(indicator?.style.transitionDuration).toBe("520ms");
  });
});
