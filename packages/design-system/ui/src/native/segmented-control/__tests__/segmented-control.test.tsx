/**
 * Stackra file contract:
 * Purpose: proves the native SegmentedControl: a labelled radiogroup of radios with the first (or default) one
 *          checked; a press on another segment chooses it with a selection haptic and reports it, a press on the
 *          current one does nothing; disabled segments and a disabled control refuse; it can be controlled; sizes
 *          and full width set the classes; the thumb jumps under the chosen segment once it is measured, then
 *          springs to each new choice, and only jumps under reduced motion.
 * Boundary: React Native, heroui-native, lucide and Reanimated do not run in vitest, so they and the house Text and
 *           SlotIcon are recording stand-ins that render plain DOM; the thumb's shared values record each set.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SegmentedControl } from "#native/segmented-control/segmented-control";
import type { SegmentedControlProps } from "#native/segmented-control/segmented-control.props";

const state = vi.hoisted(() => ({
  reduced: false,
  sets: [] as unknown[],
  root: {} as Record<string, unknown>,
  thumb: {} as Record<string, unknown>,
  radios: {} as Record<string, Record<string, unknown>>,
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.root = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.radios[props["accessibilityLabel"] as string] = props;
      return createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          onClick: props["disabled"] ? undefined : (props["onPress"] as () => void),
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.thumb = props;
        return createElement("div");
      },
    },
    useSharedValue: (initial: number) => ({
      get: () => initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withSpring: (to: number) => ({ spring: to }),
  };
});
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (names: string[]) => names,
}));
vi.mock("lucide-react-native", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) =>
      createElement(Fragment, null, props["children"] as ReactNode),
  };
});
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { "data-type": props["type"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const ITEMS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week", icon: "calendar" as const },
  { id: "month", label: "Month", isDisabled: true },
];
const draw = (props: Partial<SegmentedControlProps> = {}) =>
  render(<SegmentedControl label="Range" items={ITEMS} {...props} />);
const checked = () =>
  Object.entries(state.radios)
    .filter(([, radio]) => (radio["accessibilityState"] as { checked: boolean }).checked)
    .map(([name]) => name);
const layout = (name: string, x: number, width: number) =>
  act(() =>
    (state.radios[name]?.["onLayout"] as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { layout: { x, width } },
    }),
  );

beforeEach(() => {
  state.reduced = false;
  state.sets.length = 0;
  state.root = {};
  state.thumb = {};
  state.radios = {};
  state.played.length = 0;
});

describe("SegmentedControl (native)", () => {
  it("is a labelled radiogroup with the first segment checked", () => {
    draw();
    expect(state.root).toMatchObject({
      accessibilityRole: "radiogroup",
      accessibilityLabel: "Range",
    });
    expect(String(state.root["className"])).toContain("self-start");
    expect(checked()).toEqual(["Day"]);
    expect(state.radios["Month"]).toMatchObject({
      disabled: true,
      accessibilityState: { checked: false, disabled: true },
    });
    expect(String(state.radios["Day"]?.["className"])).toContain("h-9");
  });

  it("chooses another segment with a haptic and ignores the current one", () => {
    const onSelectionChange = vi.fn();
    draw({ onSelectionChange });
    fireEvent.click(screen.getByLabelText("Day"));
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Week"));
    expect(onSelectionChange).toHaveBeenCalledWith("week");
    expect(state.played).toEqual(["selection"]);
    expect(checked()).toEqual(["Week"]);
  });

  it("is controlled by selectedKey and refuses every segment while disabled", () => {
    const onSelectionChange = vi.fn();
    draw({
      selectedKey: "week",
      onSelectionChange,
      isDisabled: true,
      size: "lg",
      isFullWidth: true,
    });
    expect(checked()).toEqual(["Week"]);
    expect(state.radios["Day"]?.["disabled"]).toBe(true);
    expect(String(state.root["className"])).toContain("self-stretch opacity-50");
    expect(String(state.radios["Day"]?.["className"])).toContain("h-11 flex-1");
    expect(screen.getByText("Day").getAttribute("data-type")).toBe("body");
  });

  it("jumps the thumb under the chosen segment once measured, then springs to each choice", () => {
    draw({ defaultSelectedKey: "week", size: "sm" });
    layout("Day", 0, 60);
    expect(state.sets).toEqual([]);
    layout("Week", 60, 70);
    expect(state.sets).toEqual([60, 70]);
    fireEvent.click(screen.getByLabelText("Day"));
    expect(state.sets.slice(2)).toEqual([{ spring: 0 }, { spring: 60 }]);
    expect(state.thumb["style"]).toContainEqual({ width: 0, transform: [{ translateX: 0 }] });
  });

  it("only jumps under reduced motion", () => {
    state.reduced = true;
    draw();
    layout("Day", 0, 60);
    layout("Week", 60, 70);
    fireEvent.click(screen.getByLabelText("Week"));
    expect(state.sets).toEqual([0, 60, 60, 70]);
  });

  it("checks nothing and places no thumb without items", () => {
    draw({ items: [] });
    expect(checked()).toEqual([]);
    expect(state.sets).toEqual([]);
  });
});
