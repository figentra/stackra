/**
 * Stackra file contract:
 * Purpose: proves the web Sheet opens from its trigger, `defaultOpen` and `isOpen`, reports changes through
 *          `onOpenChange`, is a dialog named by its title (level 2) or its `label`, opens on the bottom edge by default
 *          and maps `start` and `end` to HeroUI's physical edge by the reading direction, draws the handle on the top
 *          and bottom edges only, hands `backdrop`, `isDetached` and the snap points to HeroUI, closes from
 *          `Sheet.Close` and from a `slot="close"` button, opens a Sheet inside another as a nested sheet, and pauses
 *          page shortcuts while open (ADR 0508).
 * Boundary: jsdom with real HeroUI and React Aria; jsdom has no scroll snapping, so the swipe and the snap positions
 *           are the browser's to check, not this test's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.2 and 4.1.2; ADR 0022; ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "react-aria-components";

import { Button } from "#react/button/button";
import { Pagination } from "#react/pagination/pagination";
import { Sheet } from "#react/sheet/sheet";
import type { SheetProps } from "#react/sheet/sheet.props";

const press = (element: HTMLElement) => act(() => element.click());

/** A sheet with a trigger and the usual parts; the caller's props win. */
function sample(props: Partial<SheetProps> = {}): ReactElement {
  return (
    <Sheet trigger={<Button>Open</Button>} {...props}>
      <Sheet.Close label="Close" />
      <Sheet.Header>
        <Sheet.Title>Filters</Sheet.Title>
      </Sheet.Header>
      <Sheet.Body>Body</Sheet.Body>
      <Sheet.Footer>
        <Button slot="close">Done</Button>
      </Sheet.Footer>
    </Sheet>
  );
}

const content = () => document.querySelector('[data-slot="sheet-content"]');

describe("Sheet (web)", () => {
  // jsdom lacks the two browser APIs React Aria's scroll-snap sheet reads; the gesture itself is not simulated.
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}

        takeRecords() {
          return [];
        }
      },
    );
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value(this: HTMLElement) {
        queueMicrotask(() => this.dispatchEvent(new Event("scrollend")));
      },
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
    vi.unstubAllGlobals();
  });

  it("stays closed until its trigger is pressed, then is a dialog named by its level-2 title", () => {
    render(sample());
    expect(screen.queryByRole("dialog")).toBeNull();
    press(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Filters" }).tagName).toBe("H2");
  });

  it("opens from `defaultOpen`, on the bottom edge with its handle", () => {
    render(sample({ defaultOpen: true }));
    expect(content()?.getAttribute("data-placement")).toBe("bottom");
    expect(document.querySelector('[data-slot="sheet-handle"]')).toBeTruthy();
  });

  it("is driven by `isOpen` and reports a close from `Sheet.Close` and from `slot=close`", () => {
    const onOpenChange = vi.fn();
    render(sample({ isOpen: true, onOpenChange }));
    press(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    press(screen.getByRole("button", { name: "Done" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is named by `label` when it has no title", () => {
    render(
      <Sheet defaultOpen label="Quick pick">
        <Sheet.Body>Body</Sheet.Body>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Quick pick" })).toBeTruthy();
  });

  it("maps `start` and `end` to the physical edge by direction, with no handle on the side", () => {
    const { unmount } = render(sample({ defaultOpen: true, placement: "end" }));
    expect(content()?.getAttribute("data-placement")).toBe("right");
    expect(document.querySelector('[data-slot="sheet-handle"]')).toBeNull();
    unmount();
    render(
      <I18nProvider locale="ar">{sample({ defaultOpen: true, placement: "end" })}</I18nProvider>,
    );
    expect(content()?.getAttribute("data-placement")).toBe("left");
  });

  it("hands the backdrop, the detached look and the snap points to HeroUI", () => {
    render(
      sample({ defaultOpen: true, backdrop: "blur", isDetached: true, snapPoints: [200, "60%"] }),
    );
    expect(document.querySelector(".sheet__backdrop--blur")).toBeTruthy();
    expect(content()?.hasAttribute("data-detached")).toBe(true);
    expect(content()?.hasAttribute("data-snap-points")).toBe(true);
  });

  it("opens a Sheet inside another as a nested sheet over it", () => {
    render(
      <Sheet defaultOpen label="Parent">
        <Sheet.Body>
          <Sheet trigger={<Button>Deeper</Button>} label="Child">
            <Sheet.Body>Child body</Sheet.Body>
          </Sheet>
        </Sheet.Body>
      </Sheet>,
    );
    press(screen.getByRole("button", { name: "Deeper" }));
    expect(
      screen.getByText("Child body").closest('[role="dialog"]')?.getAttribute("aria-label"),
    ).toBe("Child");
    expect(document.querySelectorAll('[data-slot="sheet-content"]')).toHaveLength(2);
  });

  it("pauses page shortcuts while open", () => {
    const onPageChange = vi.fn();
    render(
      <ShortcutProvider>
        <Pagination total={100} defaultPage={2} onPageChange={onPageChange} />
        <Sheet isOpen label="Filters">
          <Sheet.Body>Body</Sheet.Body>
        </Sheet>
      </ShortcutProvider>,
    );
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          code: "ArrowRight",
          key: "ArrowRight",
          altKey: true,
        }),
      );
    });
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
