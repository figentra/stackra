/**
 * Stackra file contract:
 * Purpose: proves the native `ViewStack` shows only the top view, pushes and pops through `useViewStack()` and
 *          `ViewStack.Back`, reports each move, announces the view that appears, slides a push in from the reading
 *          end (the left in right-to-left) and plays nothing at the `none` level.
 * Boundary: React Native and Reanimated do not run in vitest: View, Animated.View, Button and Icon are plain DOM
 *           stand-ins, and Reanimated's presets are their names.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { useViewStack } from "#native/view-stack/use-view-stack";
import { ViewStack } from "#native/view-stack/view-stack";

const recorded = vi.hoisted(() => ({
  announced: [] as string[],
  animation: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] },
        props["children"] as ReactNode,
      ),
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => recorded.announced.push(text),
    },
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const preset = (name: string) => ({ duration: () => name });
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        recorded.animation = { entering: props["entering"], exiting: props["exiting"] };
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    ...Object.fromEntries(
      [
        "FadeIn",
        "FadeOut",
        "SlideInLeft",
        "SlideInRight",
        "SlideInUp",
        "SlideOutLeft",
        "SlideOutRight",
        "SlideOutUp",
      ].map((name) => [name, preset(name)]),
    ),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

/** Opens the details view. */
function Open() {
  const { push } = useViewStack();
  return (
    <button type="button" onClick={() => push("details")}>
      Open
    </button>
  );
}

const stack = (state: Partial<DesignSystemState>, onViewChange?: (view: string) => void) => (
  <DesignSystemContext value={state as DesignSystemState}>
    <ViewStack defaultView="list" {...(onViewChange ? { onViewChange } : {})}>
      <ViewStack.View id="list" label="Orders">
        <Open />
      </ViewStack.View>
      <ViewStack.View id="details" label="Order 1042">
        <ViewStack.Back>Orders</ViewStack.Back>
      </ViewStack.View>
    </ViewStack>
  </DesignSystemContext>
);

describe("ViewStack (native)", () => {
  beforeEach(() => {
    recorded.announced = [];
    recorded.animation = {};
  });

  it("pushes from the reading end, announces, reports and pops back", () => {
    const onViewChange = vi.fn();
    render(stack({ direction: "rtl", resolvedMotion: "full" }, onViewChange));
    expect(recorded.animation).toEqual({ entering: undefined, exiting: undefined });
    act(() => fireEvent.click(screen.getByText("Open")));
    expect(screen.getByLabelText("Order 1042")).toBeTruthy();
    expect(recorded.announced).toEqual(["Order 1042"]);
    expect(onViewChange).toHaveBeenLastCalledWith("details");
    expect(recorded.animation).toEqual({ entering: "SlideInLeft", exiting: "SlideOutRight" });
    act(() => fireEvent.click(screen.getByText("Orders")));
    expect(screen.getByLabelText("Orders")).toBeTruthy();
    expect(recorded.animation).toEqual({ entering: "SlideInRight", exiting: "SlideOutLeft" });
    expect(onViewChange).toHaveBeenLastCalledWith("list");
  });

  it("plays nothing at none", () => {
    render(stack({ resolvedMotion: "none" }));
    act(() => fireEvent.click(screen.getByText("Open")));
    expect(recorded.animation).toEqual({ entering: undefined, exiting: undefined });
  });
});
