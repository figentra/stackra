/**
 * Stackra file contract:
 * Purpose: proves the web SplitView: two named regions side by side from the tablet size class and one at a time on a
 *          phone; with `isResizable` a window splitter that resizes the list pane by keyboard within its bounds
 *          (mirrored in right-to-left) and by pointer, kept under `storageKey`; none without it or on a phone.
 * Boundary: jsdom; `useBreakpoint` is replaced to choose the size class. Styles and attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WAI-ARIA window splitter; STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { BreakpointState } from "#contracts/types/breakpoint-state.type";
import { SplitView } from "#react/split-view/split-view";
import type { SplitViewProps } from "#react/split-view/split-view.props";

const screenSize: { current: BreakpointState } = {
  current: { breakpoint: "xl", sizeClass: "desktop" },
};
vi.mock("#react/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => screenSize.current,
}));

const view = (props: Partial<SplitViewProps> = {}) =>
  render(
    <SplitView
      primary={<p>List</p>}
      secondary={<p>Detail</p>}
      primaryLabel="Orders"
      secondaryLabel="Order details"
      {...props}
    />,
  );

const columns = () =>
  (screen.getByRole("region", { name: "Orders" }).parentElement as HTMLElement).style
    .gridTemplateColumns;

beforeEach(() => {
  screenSize.current = { breakpoint: "xl", sizeClass: "desktop" };
  window.localStorage.clear();
});

describe("SplitView", () => {
  it("draws both regions side by side and no splitter unless resizable", () => {
    view({ primaryWidth: 300 });
    expect(screen.getByRole("region", { name: "Orders" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Order details" })).toBeTruthy();
    expect(columns()).toBe("300px minmax(0, 1fr)");
    expect(screen.queryByRole("separator")).toBeNull();
  });

  it("shows one pane at a time on a phone, with no splitter", () => {
    screenSize.current = { breakpoint: undefined, sizeClass: "phone" };
    view({ isResizable: true, isSecondaryShown: true });
    expect(screen.queryByRole("region", { name: "Orders" })).toBeNull();
    expect(screen.getByRole("region", { name: "Order details" })).toBeTruthy();
    expect(screen.queryByRole("separator")).toBeNull();
  });

  it("resizes the list pane from the splitter by keyboard, mirrored in right-to-left", () => {
    const onPrimaryWidthChange = vi.fn();
    view({
      isResizable: true,
      primaryWidth: 300,
      minPrimaryWidth: 250,
      maxPrimaryWidth: 400,
      onPrimaryWidthChange,
    });
    const handle = screen.getByRole("separator", { name: "Resize panes" });
    expect(handle.getAttribute("aria-controls")).toBe(
      screen.getByRole("region", { name: "Orders" }).id,
    );
    expect(handle.getAttribute("aria-valuenow")).toBe("300");
    // The strip is on the list pane's end border: moving it towards the end widens the list.
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle.getAttribute("aria-valuenow")).toBe("316");
    expect(columns()).toBe("316px minmax(0, 1fr)");
    expect(handle.style.insetInlineStart).toBe("312px");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle.getAttribute("aria-valuenow")).toBe("400");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle.getAttribute("aria-valuenow")).toBe("250");
    handle.style.direction = "rtl";
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle.getAttribute("aria-valuenow")).toBe("266");
    expect(onPrimaryWidthChange).toHaveBeenLastCalledWith(266);
  });

  it("resizes by pointer and keeps the width under storageKey", () => {
    const { unmount } = view({ isResizable: true, primaryWidth: 300, storageKey: "orders" });
    const handle = screen.getByRole("separator");
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 360, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 360, pointerId: 1 });
    expect(columns()).toBe("360px minmax(0, 1fr)");
    unmount();
    expect(window.localStorage.getItem("orders:width")).toBe("360");
    view({ isResizable: true, primaryWidth: 300, storageKey: "orders" });
    expect(columns()).toBe("360px minmax(0, 1fr)");
  });
});
