/**
 * Stackra file contract:
 * Purpose: proves the native SortableList is a list named by its label whose rows offer "Move up" and "Move down"
 *          accessibility actions (none past either end, none when locked) that reorder the rows and announce the new
 *          position, and that a row's drag handle carries the pan handlers.
 * Boundary: jsdom with React Native, Reanimated, HeroUI Native and the house parts replaced by stand-ins; the pan
 *           itself is React Native's and is not driven here.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 10.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SortableList } from "#native/sortable-list/sortable-list";

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  announced: [] as string[],
  handles: 0,
}));

vi.mock("heroui-native", () => ({ useThemeColor: () => "color:foreground" }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      if (props["onResponderGrant"] === "grant") state.handles += 1;
      return createElement(
        "div",
        {
          role: props["accessibilityRole"] as string | undefined,
          "aria-label": props["accessibilityLabel"] as string | undefined,
        },
        props["children"] as ReactNode,
      );
    },
    PanResponder: { create: () => ({ panHandlers: { onResponderGrant: "grant" } }) },
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => state.announced.push(text),
    },
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.rows.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => {
      let current = value;
      return { get: () => current, set: (next: unknown) => (current = next) };
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withSpring: (to: number) => to,
  };
});

vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const STEPS = [
  { id: "greet", label: "Greet the guest" },
  { id: "order", label: "Take the order" },
  { id: "pay", label: "Take payment", isDisabled: true },
];

/** The last-drawn props of the row named `label`. */
const rowOf = (label: string) =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  state.rows.filter((row) => row["accessibilityLabel"] === label).at(-1) ?? {};
const actionsOf = (label: string) =>
  (rowOf(label)["accessibilityActions"] as { name: string }[] | undefined)?.map(
    (action) => action.name,
  );

describe("SortableList (native)", () => {
  beforeEach(() => {
    state.rows = [];
    state.announced = [];
    state.handles = 0;
  });

  it("offers move actions within the ends, none on a locked row, and a handle per movable row", () => {
    render(<SortableList items={STEPS} onReorder={vi.fn()} label="Service steps" />);
    expect(screen.getByRole("list", { name: "Service steps" })).toBeTruthy();
    expect(actionsOf("Greet the guest")).toEqual(["move_down"]);
    expect(actionsOf("Take the order")).toEqual(["move_up", "move_down"]);
    expect(actionsOf("Take payment")).toBeUndefined();
    expect(state.handles).toBe(2);
  });

  it("reorders on an accessibility action and announces the new position", () => {
    const onReorder = vi.fn();
    render(<SortableList items={STEPS} onReorder={onReorder} label="Service steps" />);
    const act = rowOf("Greet the guest")["onAccessibilityAction"] as (event: {
      nativeEvent: { actionName: string };
    }) => void;
    act({ nativeEvent: { actionName: "move_down" } });
    expect(onReorder.mock.lastCall?.[0].map((step: { id: string }) => step.id)).toEqual([
      "order",
      "greet",
      "pay",
    ]);
    expect(state.announced).toEqual(["Greet the guest moved to position 2 of 3"]);
  });

  it("adds the caller's row actions, also on a locked row, and runs them", () => {
    const onAction = vi.fn();
    const onReorder = vi.fn();
    render(
      <SortableList
        items={STEPS}
        onReorder={onReorder}
        label="Service steps"
        accessibilityActionsOf={(item) => [
          { name: "toggle", label: `Hide ${item.label}`, onAction },
        ]}
      />,
    );
    expect(actionsOf("Take the order")).toEqual(["move_up", "move_down", "toggle"]);
    expect(actionsOf("Take payment")).toEqual(["toggle"]);
    const act = rowOf("Take payment")["onAccessibilityAction"] as (event: {
      nativeEvent: { actionName: string };
    }) => void;
    act({ nativeEvent: { actionName: "toggle" } });
    act({ nativeEvent: { actionName: "move_up" } });
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onReorder).not.toHaveBeenCalled();
  });
});
