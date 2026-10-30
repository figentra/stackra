/**
 * Stackra file contract:
 * Purpose: proves the web SidePanel: the states (closed, open, expanded) uncontrolled and controlled, from the launcher,
 *          the header's expand toggle (pressed while expanded) and close button and Escape; the page beside it inert
 *          while expanded; resizing from the handle by pointer and keyboard within the bounds, mirrored in
 *          right-to-left; the state and width kept under `storageKey`; focus moving into the panel on open and back to
 *          the opener on close; and the house Drawer below the breakpoint.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so attributes and styles are checked,
 *           not looks. `useBreakpoint` is replaced to choose the window width.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WAI-ARIA window splitter; owner request
 *          2026-10-29 (STA-1371, side panel).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import type { SidePanelState } from "#contracts/enums/side-panel-state.enum";
import type { BreakpointState } from "#contracts/types/breakpoint-state.type";
import { SidePanel } from "#react/side-panel/side-panel";
import type { SidePanelProps } from "#react/side-panel/side-panel.props";

const screenSize: { current: BreakpointState } = {
  current: { breakpoint: "xl", sizeClass: "desktop" },
};
vi.mock("#react/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => screenSize.current,
}));

const press = (element: HTMLElement) => act(() => element.click());

/** A page with a toolbar button, the panel with its parts, and a launcher. */
function Page(props: Partial<SidePanelProps>) {
  return (
    <SidePanel label="Assistant" {...props}>
      <SidePanel.Inset data-testid="page">
        <button type="button">Page button</button>
      </SidePanel.Inset>
      <SidePanel.Panel>
        <SidePanel.Handle />
        <SidePanel.Header>Recent</SidePanel.Header>
        <SidePanel.Body>
          <input aria-label="Ask" data-autofocus />
        </SidePanel.Body>
        <SidePanel.Footer>Footer</SidePanel.Footer>
      </SidePanel.Panel>
      <SidePanel.Launcher title="Open assistant" />
    </SidePanel>
  );
}

/** The page's frame, the element that shrinks and goes inert; the caller's props sit on the box inside it. */
const frame = () => screen.getByTestId("page").parentElement as HTMLElement;

const panel = () => screen.getByRole("complementary", { name: "Assistant", hidden: true });

beforeEach(() => {
  screenSize.current = { breakpoint: "xl", sizeClass: "desktop" };
  window.localStorage.clear();
  document.documentElement.dir = "ltr";
});

/** The panel under a controlled state, the state shown beside it. */
function Controlled() {
  const [state, setState] = useState<SidePanelState>("open");
  return (
    <>
      <output>{state}</output>
      <Page state={state} onStateChange={setState} />
    </>
  );
}

/** The panel under a controlled state with an outside toolbar button that opens and closes it. */
function WithToolbar(props: Partial<SidePanelProps>) {
  const [state, setState] = useState<SidePanelState>("closed");
  return (
    <>
      <button type="button" onClick={() => setState(state === "closed" ? "open" : "closed")}>
        Toolbar
      </button>
      <Page state={state} onStateChange={setState} {...props} />
    </>
  );
}

/** The panel under a controlled state with an outside toggle. */
function ToggledPage() {
  const [state, setState] = useState<SidePanelState>("open");
  return (
    <>
      <button type="button" onClick={() => setState(state === "closed" ? "open" : "closed")}>
        Toggle
      </button>
      <Page state={state} onStateChange={setState} />
    </>
  );
}

describe("SidePanel (web)", () => {
  it("starts closed with the launcher, and opens from it into a pushing column", () => {
    const onStateChange = vi.fn();
    render(<Page onStateChange={onStateChange} />);
    expect(panel().hasAttribute("inert")).toBe(true);
    expect(panel().style.width).toBe("0px");
    press(screen.getByRole("button", { name: "Open assistant" }));
    expect(onStateChange).toHaveBeenCalledWith("open");
    expect(panel().hasAttribute("inert")).toBe(false);
    expect(panel().style.width).toBe("432px");
    expect(screen.queryByRole("button", { name: "Open assistant" })).toBeNull();
  });

  it("expands and collapses back from the header's toggle, inerting the page while expanded", () => {
    render(<Page defaultState="open" />);
    const expand = screen.getByRole("button", { name: "Expand panel" });
    expect(expand.getAttribute("aria-pressed")).toBe("false");
    press(expand);
    expect(panel().style.width).toBe("100%");
    expect(frame().hasAttribute("inert")).toBe(true);
    expect(screen.getByRole("button", { name: "Expand panel" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    press(screen.getByRole("button", { name: "Expand panel" }));
    expect(panel().style.width).toBe("432px");
    expect(frame().hasAttribute("inert")).toBe(false);
  });

  it("closes from the close button and from Escape inside it", () => {
    render(<Page defaultState="open" />);
    press(screen.getByRole("button", { name: "Close panel" }));
    expect(panel().hasAttribute("inert")).toBe(true);
    press(screen.getByRole("button", { name: "Open assistant" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Ask" }), { key: "Escape" });
    expect(panel().hasAttribute("inert")).toBe(true);
  });

  it("follows a controlled state", () => {
    render(<Controlled />);
    press(screen.getByRole("button", { name: "Expand panel" }));
    expect(screen.getByRole("status").textContent).toBe("expanded");
    press(screen.getByRole("button", { name: "Close panel" }));
    expect(screen.getByRole("status").textContent).toBe("closed");
  });

  it("resizes from the handle by keyboard within the bounds, mirrored in right-to-left", () => {
    const onWidthChange = vi.fn();
    render(
      <Page
        defaultState="open"
        minWidth={300}
        maxWidth={400}
        defaultWidth={360}
        onWidthChange={onWidthChange}
      />,
    );
    const handle = screen.getByRole("separator", { name: "Resize panel" });
    expect(handle.getAttribute("aria-orientation")).toBe("vertical");
    expect(handle.getAttribute("aria-valuenow")).toBe("360");
    expect(handle.getAttribute("aria-valuemin")).toBe("300");
    expect(handle.getAttribute("aria-valuemax")).toBe("400");
    // The handle is on the panel's start border: moving it towards the start widens the panel.
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle.getAttribute("aria-valuenow")).toBe("376");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle.getAttribute("aria-valuenow")).toBe("400");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle.getAttribute("aria-valuenow")).toBe("400");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle.getAttribute("aria-valuenow")).toBe("300");
    document.documentElement.dir = "rtl";
    handle.style.direction = "rtl";
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle.getAttribute("aria-valuenow")).toBe("316");
    expect(onWidthChange).toHaveBeenLastCalledWith(316);
  });

  it("resizes from the handle by pointer, with the transition off during the drag", () => {
    render(<Page defaultState="open" />);
    const handle = screen.getByRole("separator", { name: "Resize panel" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { button: 0, clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 440, pointerId: 1 });
    expect(panel().hasAttribute("data-resizing")).toBe(true);
    expect(panel().style.width).toBe("492px");
    fireEvent.pointerUp(handle, { clientX: 440, pointerId: 1 });
    expect(panel().hasAttribute("data-resizing")).toBe(false);
  });

  it("keeps the state and the width under storageKey", () => {
    const { unmount } = render(<Page storageKey="test-panel" defaultState="open" />);
    fireEvent.keyDown(screen.getByRole("separator"), { key: "Home" });
    press(screen.getByRole("button", { name: "Expand panel" }));
    unmount();
    expect(window.localStorage.getItem("test-panel:state")).toBe("expanded");
    expect(window.localStorage.getItem("test-panel:width")).toBe("320");
    render(<Page storageKey="test-panel" />);
    expect(panel().style.width).toBe("100%");
    press(screen.getByRole("button", { name: "Expand panel" }));
    expect(panel().style.width).toBe("320px");
  });

  it("moves focus into the panel on open and back to the opener on close", () => {
    render(<Page />);
    const launcher = screen.getByRole("button", { name: "Open assistant" });
    act(() => launcher.focus());
    press(launcher);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Ask" }));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Escape" });
    // The launcher that opened it is gone while open; a new one is drawn on close and takes focus.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Open assistant" }));
  });

  it("returns focus to an outside opener, and leaves focus alone when told to", () => {
    const { unmount } = render(<WithToolbar />);
    const toolbar = screen.getByRole("button", { name: "Toolbar" });
    act(() => toolbar.focus());
    press(toolbar);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Ask" }));
    press(screen.getByRole("button", { name: "Close panel" }));
    expect(document.activeElement).toBe(toolbar);
    unmount();
    render(<WithToolbar isFocusOnOpen={false} />);
    const again = screen.getByRole("button", { name: "Toolbar" });
    act(() => again.focus());
    press(again);
    expect(document.activeElement).toBe(again);
  });

  it("is the house Drawer below the breakpoint, without the expand button or handle", () => {
    screenSize.current = { breakpoint: "sm", sizeClass: "phone" };
    render(<Page />);
    expect(screen.queryByRole("complementary")).toBeNull();
    press(screen.getByRole("button", { name: "Open assistant" }));
    const dialog = screen.getByRole("dialog", { name: "Assistant" });
    expect(within(dialog).getByText("Recent")).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: "Expand panel" })).toBeNull();
    expect(within(dialog).queryByRole("separator")).toBeNull();
    expect(frame().hasAttribute("inert")).toBe(false);
  });

  it("starts shut below the breakpoint even when it would start open, so no page loads behind a modal", () => {
    screenSize.current = { breakpoint: "sm", sizeClass: "phone" };
    render(<Page defaultState="open" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Open assistant" })).toBeTruthy();
  });

  it("does not open a controlled drawer on load, only from a change", () => {
    screenSize.current = { breakpoint: "sm", sizeClass: "phone" };
    render(<ToggledPage />);
    expect(screen.queryByRole("dialog")).toBeNull();
    press(screen.getByRole("button", { name: "Toggle" }));
    press(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByRole("dialog", { name: "Assistant" })).toBeTruthy();
  });

  it("stays in the page at every width with drawerBelow false", () => {
    screenSize.current = { breakpoint: undefined, sizeClass: "phone" };
    render(<Page drawerBelow={false} defaultState="open" />);
    expect(panel().style.width).toBe("432px");
  });

  it("defaults to 27 rem wide with at most half the window, and draws the split look as two cards", () => {
    render(<Page defaultState="open" variant="split" />);
    const handle = screen.getByRole("separator");
    expect(handle.getAttribute("aria-valuemin")).toBe("320");
    expect(handle.getAttribute("aria-valuemax")).toBe(String(Math.round(window.innerWidth / 2)));
    // The gap between the page and the card is inside the column, so a closed panel leaves none.
    expect(panel().style.width).toBe("calc(432px + 0.5rem)");
    expect(panel().querySelector("[data-slot=side-panel-card]")?.className).toContain("rounded-");
    expect(frame().className).toContain("rounded-");
    press(screen.getByRole("button", { name: "Close panel" }));
    expect(panel().style.width).toBe("0px");
  });

  it("focuses the field inside a wrapper marked data-autofocus", () => {
    render(
      <SidePanel label="Assistant">
        <SidePanel.Panel>
          <div data-autofocus>
            <input aria-label="Inner" />
          </div>
        </SidePanel.Panel>
        <SidePanel.Launcher title="Open assistant" />
      </SidePanel>,
    );
    press(screen.getByRole("button", { name: "Open assistant" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Inner" }));
  });
});
