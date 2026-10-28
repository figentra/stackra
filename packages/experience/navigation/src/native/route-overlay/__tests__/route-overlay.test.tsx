/**
 * Stackra file contract:
 * Purpose: proves the native RouteOverlay: a `modal` or `full-screen` screen draws its own heading, close button, body
 *          and footer, pops the screen on close, keeps the stack's swipe-down in step with `isDismissable` and clears
 *          the status bar only when full-screen; a `sheet` or `drawer` screen opens `@stackra/ui`'s inset `Drawer`
 *          open, pops the screen when the sheet closes and hands it `isDismissable`; `complete` pops and then opens
 *          the given path; `setDismissable` reaches both forms; and a cold-start overlay, with nothing to go back
 *          to, is replaced with its stack's first screen.
 * Boundary: React Native does not render in vitest, so React Navigation, `@stackra/ui/native`, react-native and the
 *           safe-area hook are replaced by recording stand-ins that render plain DOM; what reaches them is checked, not
 *           how it draws, and the sheet over a native modal is a device check.
 * Runtime: node
 * Governing contract: ADR 0317 (decisions 2, 8 and 9); ADR 0312; ADR 0022 (test placement); WCAG 2.2 SC 2.1.2 and
 *          4.1.2.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-182
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { RouteOverlay } from "#native/route-overlay/route-overlay";
import { useRouteOverlay } from "#native/route-overlay/use-route-overlay";

/** What the stand-ins were last handed, by name. */
const seen = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));
const nav = vi.hoisted(() => ({
  goBack: vi.fn(),
  canGoBack: vi.fn(() => true),
  setOptions: vi.fn(),
  linkTo: vi.fn(),
  replace: vi.fn(),
  getState: vi.fn(() => STACK),
}));

/** The stack a cold-start deep link builds: only the overlay, over a stack whose first screen is Home. */
const STACK = vi.hoisted(() => ({
  routeNames: ["Home", "Order"],
  routes: [{ name: "Order" }],
  index: 0,
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => nav,
  useLinkTo: () => nav.linkTo,
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      seen.props["view"] = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  const record = (name: string, tag = "div") => {
    const part = (props: Record<string, unknown>) => {
      seen.props[name] = props;
      return createElement(tag, { "data-testid": name }, props["children"] as ReactNode);
    };
    return part;
  };
  const closeButton = (props: Record<string, unknown>) => {
    seen.props["closeButton"] = props;
    return createElement(
      "button",
      {
        type: "button",
        onClick: props["onPress"] as () => void,
        "aria-label": props["label"] as string,
      },
      null,
    );
  };
  const drawerClose = (props: Record<string, unknown>) => {
    seen.props["drawerClose"] = props;
    return createElement(
      "button",
      { type: "button", "aria-label": props["label"] as string },
      null,
    );
  };
  return {
    Drawer: Object.assign(record("drawer"), {
      Close: drawerClose,
      Header: record("header"),
      Title: record("title"),
      Body: record("body"),
      Footer: record("footer"),
    }),
    Heading: record("heading"),
    CloseButton: closeButton,
  };
});

const propsOf = (name: string) => seen.props[name] ?? {};

/** A screen page that calls the hook, as a form would. */
function Inside() {
  const overlay = useRouteOverlay();
  return (
    <>
      <button type="button" onClick={() => overlay.complete("/orders/ord_1")}>
        Done
      </button>
      <button type="button" onClick={() => overlay.setDismissable(false)}>
        Lock
      </button>
    </>
  );
}

describe("RouteOverlay (native)", () => {
  beforeEach(() => {
    seen.props = {};
    nav.goBack.mockClear();
    nav.setOptions.mockClear();
    nav.linkTo.mockClear();
    nav.replace.mockClear();
    nav.canGoBack.mockReturnValue(true);
    nav.getState.mockReturnValue(STACK);
  });

  it.each(["modal", "full-screen"] as const)(
    "draws its own heading and close button for %s, and pops the screen on close",
    (presentation) => {
      render(
        <RouteOverlay title="Edit order" closeLabel="Close" presentation={presentation}>
          <Inside />
        </RouteOverlay>,
      );
      expect(screen.getByTestId("heading").textContent).toBe("Edit order");
      expect(propsOf("heading")["level"]).toBe(2);
      expect(propsOf("closeButton")["label"]).toBe("Close");
      expect(screen.queryByTestId("drawer")).toBeNull();
      act(() => screen.getByRole("button", { name: "Close" }).click());
      expect(nav.goBack).toHaveBeenCalledTimes(1);
    },
  );

  it("clears the status bar only when full-screen", () => {
    const { unmount } = render(<RouteOverlay title="T" closeLabel="Close" />);
    expect((propsOf("view")["style"] as { paddingTop: number }).paddingTop).toBe(16);
    unmount();
    render(<RouteOverlay title="T" closeLabel="Close" presentation="full-screen" />);
    expect(propsOf("view")["style"]).toEqual({ paddingTop: 60, paddingBottom: 46 });
  });

  it("keeps the stack's swipe-down in step with isDismissable on a platform modal", () => {
    render(
      <RouteOverlay title="T" closeLabel="Close" isDismissable={false}>
        <Inside />
      </RouteOverlay>,
    );
    expect(nav.setOptions).toHaveBeenLastCalledWith({ gestureEnabled: false });
  });

  it("turns the swipe-down off through setDismissable", () => {
    render(
      <RouteOverlay title="T" closeLabel="Close">
        <Inside />
      </RouteOverlay>,
    );
    expect(nav.setOptions).toHaveBeenLastCalledWith({ gestureEnabled: true });
    act(() => screen.getByRole("button", { name: "Lock" }).click());
    expect(nav.setOptions).toHaveBeenLastCalledWith({ gestureEnabled: false });
  });

  it.each(["sheet", "drawer"] as const)(
    "opens the inset Drawer for %s, open, and pops the screen when it closes",
    (presentation) => {
      render(
        <RouteOverlay title="Edit order" closeLabel="Close" presentation={presentation}>
          Body
        </RouteOverlay>,
      );
      expect(propsOf("drawer")["isOpen"]).toBe(true);
      expect(propsOf("drawer")["isDismissable"]).toBe(true);
      expect(screen.getByTestId("title").textContent).toBe("Edit order");
      expect(propsOf("drawerClose")["label"]).toBe("Close");
      expect(screen.queryByTestId("heading")).toBeNull();
      // The sheet owns its gestures, so the stack's swipe is left to the screen options.
      expect(nav.setOptions).not.toHaveBeenCalled();

      const onOpenChange = propsOf("drawer")["onOpenChange"] as (isOpen: boolean) => void;
      act(() => onOpenChange(true));
      expect(nav.goBack).not.toHaveBeenCalled();
      act(() => onOpenChange(false));
      expect(nav.goBack).toHaveBeenCalledTimes(1);
    },
  );

  it("hands the sheet isDismissable, and takes it away through setDismissable", () => {
    render(
      <RouteOverlay title="T" closeLabel="Close" presentation="sheet">
        <Inside />
      </RouteOverlay>,
    );
    act(() => screen.getByRole("button", { name: "Lock" }).click());
    expect(propsOf("drawer")["isDismissable"]).toBe(false);
  });

  it("shows the footer under the body in both forms", () => {
    const { unmount } = render(
      <RouteOverlay title="T" closeLabel="Close" footer={<button type="button">Save</button>} />,
    );
    expect(screen.getByTestId("footer").textContent).toBe("Save");
    unmount();
    render(
      <RouteOverlay
        title="T"
        closeLabel="Close"
        presentation="sheet"
        footer={<button type="button">Save</button>}
      />,
    );
    expect(screen.getByTestId("footer").textContent).toBe("Save");
  });

  it("completes by popping and then opening the path it is given", () => {
    render(
      <RouteOverlay title="T" closeLabel="Close">
        <Inside />
      </RouteOverlay>,
    );
    act(() => screen.getByRole("button", { name: "Done" }).click());
    expect(nav.goBack).toHaveBeenCalledTimes(1);
    expect(nav.linkTo).toHaveBeenCalledWith("/orders/ord_1");
  });

  it("replaces a cold-start overlay with its stack's first screen, since there is nothing to go back to", () => {
    nav.canGoBack.mockReturnValue(false);
    render(<RouteOverlay title="T" closeLabel="Close" />);
    act(() => screen.getByRole("button", { name: "Close" }).click());
    expect(nav.goBack).not.toHaveBeenCalled();
    expect(nav.replace).toHaveBeenCalledWith("Home");
  });

  it("completes a cold-start overlay by leaving it for the first screen and then opening the path", () => {
    nav.canGoBack.mockReturnValue(false);
    render(
      <RouteOverlay title="T" closeLabel="Close">
        <Inside />
      </RouteOverlay>,
    );
    act(() => screen.getByRole("button", { name: "Done" }).click());
    expect(nav.replace).toHaveBeenCalledWith("Home");
    expect(nav.linkTo).toHaveBeenCalledWith("/orders/ord_1");
  });

  it("replaces nothing when the overlay is itself the stack's first screen", () => {
    nav.canGoBack.mockReturnValue(false);
    nav.getState.mockReturnValue({
      routeNames: ["Order"],
      routes: [{ name: "Order" }],
      index: 0,
    });
    render(<RouteOverlay title="T" closeLabel="Close" />);
    act(() => screen.getByRole("button", { name: "Close" }).click());
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
