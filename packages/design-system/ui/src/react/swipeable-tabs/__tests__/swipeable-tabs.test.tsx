/**
 * Stackra file contract:
 * Purpose: proves the web SwipeableTabs: it starts on the first enabled tab, selects by press and reports it, follows
 *          `selectedKeys` when controlled, and a horizontal touch swipe steps to the next or previous enabled tab, with
 *          the direction mirrored in RTL; a short, vertical, mouse or disabled swipe does nothing.
 * Boundary: jsdom with real HeroUI, React Aria and motion; pointer events are dispatched by hand and
 *           `ResizeObserver` is a stand-in that watches nothing.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { SwipeableTabs } from "#react/swipeable-tabs/swipeable-tabs";

const ITEMS = [
  { id: "off", label: "Off", content: "Off panel", isDisabled: true },
  { id: "one", label: "One", content: "One panel" },
  { id: "two", label: "Two", content: "Two panel" },
  { id: "three", label: "Three", content: "Three panel" },
];

const press = (element: HTMLElement) => act(() => element.click());
const selected = () =>
  screen.getAllByRole("tab").find((tab) => tab.getAttribute("aria-selected") === "true");
const swipe = (dx: number, dy = 0, pointerType = "touch") => {
  const panel = screen.getByRole("tabpanel").firstElementChild as HTMLElement;
  fireEvent.pointerDown(panel, { pointerType, clientX: 100, clientY: 100 });
  fireEvent.pointerUp(panel, { pointerType, clientX: 100 + dx, clientY: 100 + dy });
};

/** Watches nothing: jsdom has no layout, and the tab list's scroll shadow only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe("SwipeableTabs (web)", () => {
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

  it("starts on the first enabled tab and selects by press", () => {
    const onSelectionChange = vi.fn();
    render(<SwipeableTabs label="Sections" items={ITEMS} onSelectionChange={onSelectionChange} />);
    expect(selected()?.textContent).toBe("One");
    press(screen.getByRole("tab", { name: "Three" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["three"]);
    expect(selected()?.textContent).toBe("Three");
  });

  it("steps forward and back with a horizontal touch swipe", () => {
    const onSelectionChange = vi.fn();
    render(<SwipeableTabs label="Sections" items={ITEMS} onSelectionChange={onSelectionChange} />);
    swipe(-80);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["two"]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Two panel");
    swipe(80);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["one"]);
    // There is no enabled tab before the first one.
    swipe(80);
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it("ignores a short, a mostly vertical and a mouse swipe", () => {
    const onSelectionChange = vi.fn();
    render(<SwipeableTabs label="Sections" items={ITEMS} onSelectionChange={onSelectionChange} />);
    swipe(-20);
    swipe(-60, 80);
    swipe(-80, 0, "mouse");
    const panel = screen.getByRole("tabpanel").firstElementChild as HTMLElement;
    fireEvent.pointerUp(panel, { pointerType: "touch", clientX: 0, clientY: 0 });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("mirrors the swipe direction in RTL", () => {
    const onSelectionChange = vi.fn();
    render(
      <I18nProvider locale="ar-SA">
        <div dir="rtl">
          <SwipeableTabs label="Sections" items={ITEMS} onSelectionChange={onSelectionChange} />
        </div>
      </I18nProvider>,
    );
    swipe(80);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["two"]);
  });

  it("follows selectedKeys when controlled and refuses swipes while disabled", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <SwipeableTabs
        label="Sections"
        items={ITEMS}
        selectedKeys={["three"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(selected()?.textContent).toBe("Three");
    swipe(-80);
    expect(onSelectionChange).not.toHaveBeenCalled();
    rerender(
      <SwipeableTabs
        label="Sections"
        items={ITEMS}
        defaultSelectedKeys={["two"]}
        isDisabled
        onSelectionChange={onSelectionChange}
      />,
    );
    swipe(-80);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
