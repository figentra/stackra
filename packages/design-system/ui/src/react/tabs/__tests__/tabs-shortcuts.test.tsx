/**
 * Stackra file contract:
 * Purpose: proves the shortcut wiring of navigation and overlays: Mod+2 selects the second tab (and not with
 *          `hasNumberShortcuts={false}`), Alt+Right and Alt+Left page through Pagination (mirrored in right-to-left) and
 *          the buttons carry `aria-keyshortcuts`, and an open Drawer pauses page shortcuts and runs `onConfirm` on
 *          Mod+Enter.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider.
 * Runtime: browser
 * Governing contract: ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, render, screen } from "@testing-library/react";

import { Drawer } from "#react/drawer/drawer";
import { Pagination } from "#react/pagination/pagination";
import { Tabs } from "#react/tabs/tabs";

const press = (init: KeyboardEventInit) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
  });

const ITEMS = [
  { id: "a", label: "Alpha", content: "A" },
  { id: "b", label: "Beta", content: "B" },
];

/** jsdom has no ResizeObserver; the tabs measure their row with it. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
  // jsdom has no Web Animations; the selected-tab indicator asks the element for its running ones.
  Object.defineProperty(Element.prototype, "getAnimations", {
    value: () => [],
    configurable: true,
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("shortcut wiring", () => {
  it("selects the nth tab with Mod+n", () => {
    const onSelectionChange = vi.fn();
    const view = render(
      <ShortcutProvider>
        <Tabs items={ITEMS} onSelectionChange={onSelectionChange} hasNumberShortcuts />
      </ShortcutProvider>,
    );
    press({ code: "Digit2", key: "2", ctrlKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(["b"]);
    view.rerender(
      <ShortcutProvider>
        <Tabs items={ITEMS} onSelectionChange={onSelectionChange} hasNumberShortcuts={false} />
      </ShortcutProvider>,
    );
    press({ code: "Digit1", key: "1", ctrlKey: true });
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it("pages with Alt+arrows, mirrored right to left, and names the keys", () => {
    const onPageChange = vi.fn();
    const view = render(
      <ShortcutProvider>
        <Pagination total={100} defaultPage={2} onPageChange={onPageChange} />
      </ShortcutProvider>,
    );
    press({ code: "ArrowRight", key: "ArrowRight", altKey: true });
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(
      screen
        .getAllByRole("button")
        .some((button) => button.getAttribute("aria-keyshortcuts") === "Alt+ArrowRight"),
    ).toBe(true);
    view.rerender(
      <ShortcutProvider direction="rtl">
        <Pagination total={100} defaultPage={2} onPageChange={onPageChange} />
      </ShortcutProvider>,
    );
    press({ code: "ArrowLeft", key: "ArrowLeft", altKey: true });
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it("pauses page shortcuts under an open Drawer and confirms with Mod+Enter", () => {
    const onPageChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ShortcutProvider>
        <Pagination total={100} defaultPage={2} onPageChange={onPageChange} />
        <Drawer isOpen onOpenChange={() => undefined} label="Edit" onConfirm={onConfirm}>
          <p>Body</p>
        </Drawer>
      </ShortcutProvider>,
    );
    press({ code: "ArrowRight", key: "ArrowRight", altKey: true });
    expect(onPageChange).not.toHaveBeenCalled();
    press({ code: "Enter", key: "Enter", ctrlKey: true });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
