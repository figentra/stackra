/**
 * Stackra file contract:
 * Purpose: proves the native SortableList's drag: the first row's layout sets the row height, grabbing a handle lifts
 *          the row with an impact haptic, moving it follows the finger and plays a selection haptic per slot (nothing
 *          before the height is known), the rows between step aside, releasing moves the row to the slot it is over,
 *          and a cancelled drag settles back; rows draw their description or the caller's renderItem.
 * Boundary: jsdom with React Native, Reanimated, HeroUI Native and the house parts replaced by stand-ins; the pan
 *           responder's config is captured and its callbacks driven by hand, and shared values persist across renders.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 10.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SortableList } from "#native/sortable-list/sortable-list";

type Config = Record<string, (event?: unknown, gesture?: { dy: number }) => unknown>;

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  responders: [] as Config[],
  played: [] as string[],
  isReduced: false,
}));

vi.mock("heroui-native", () => ({ useThemeColor: () => "color:foreground" }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    PanResponder: {
      create: (config: Config) => {
        state.responders.push(config);
        return { panHandlers: {} };
      },
    },
    AccessibilityInfo: { announceForAccessibility: () => undefined },
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.rows.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    useReducedMotion: () => state.isReduced,
    useSharedValue: (value: unknown) => {
      const ref = useRef<{ value: unknown }>({ value });
      return { get: () => ref.current.value, set: (next: unknown) => (ref.current.value = next) };
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withSpring: (to: number) => ({ spring: to }),
  };
});

vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const ITEMS = [
  { id: "a", label: "A", description: "first" },
  { id: "b", label: "B" },
  { id: "c", label: "C" },
];

/** The last-drawn style of the row named `label`. */
const styleOf = (label: string) => {
  const row = [...state.rows].reverse().find((props) => props["accessibilityLabel"] === label);
  return (row?.["style"] as Record<string, unknown>[] | undefined)?.[0] ?? {};
};
const translateOf = (label: string) =>
  (styleOf(label)["transform"] as Record<string, unknown>[] | undefined)?.[0]?.["translateY"];

beforeEach(() => {
  state.rows = [];
  state.responders = [];
  state.played = [];
  state.isReduced = false;
});

describe("SortableList drag (native)", () => {
  it("lifts, follows, shifts the rows between and drops into the slot it is over", () => {
    const onReorder = vi.fn();
    const view = render(<SortableList items={ITEMS} onReorder={onReorder} label="List" />);
    expect(screen.getByText("first")).toBeTruthy();
    const first = state.responders[0] as Config;
    expect(first["onStartShouldSetPanResponder"]?.()).toBe(true);
    expect(first["onMoveShouldSetPanResponder"]?.()).toBe(true);

    first["onPanResponderGrant"]?.();
    first["onPanResponderMove"]?.({}, { dy: 50 });
    expect(state.played).toEqual(["impact"]);

    const firstRow = state.rows.find((props) => props["accessibilityLabel"] === "A");
    const secondRow = state.rows.find((props) => props["accessibilityLabel"] === "B");
    (secondRow?.["onLayout"] as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { layout: { height: 99 } },
    });
    (firstRow?.["onLayout"] as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { layout: { height: 40 } },
    });
    first["onPanResponderMove"]?.({}, { dy: 90 });
    first["onPanResponderMove"]?.({}, { dy: 85 });
    expect(state.played).toEqual(["impact", "selection"]);

    view.rerender(<SortableList items={ITEMS} onReorder={onReorder} label="List" />);
    expect(styleOf("A")).toMatchObject({ zIndex: 1, shadowOpacity: 0.18, elevation: 6 });
    expect(translateOf("A")).toBe(85);
    expect(translateOf("B")).toEqual({ spring: -40 });
    expect(translateOf("C")).toEqual({ spring: -40 });

    first["onPanResponderRelease"]?.();
    expect(onReorder.mock.lastCall?.[0].map((item: { id: string }) => item.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("steps the rows above aside when dragging up, and settles back when cancelled", () => {
    state.isReduced = true;
    const onReorder = vi.fn();
    const view = render(<SortableList items={ITEMS} onReorder={onReorder} label="List" />);
    const firstRow = state.rows.find((props) => props["accessibilityLabel"] === "A");
    (firstRow?.["onLayout"] as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { layout: { height: 40 } },
    });
    const last = state.responders[2] as Config;
    last["onPanResponderGrant"]?.();
    last["onPanResponderMove"]?.({}, { dy: -40 });
    view.rerender(<SortableList items={ITEMS} onReorder={onReorder} label="List" />);
    expect(translateOf("B")).toBe(40);
    expect(translateOf("A")).toBe(0);
    expect(styleOf("C")["transform"]).toEqual([{ translateY: -40 }, { scale: 1 }]);

    act(() => {
      last["onPanResponderTerminate"]?.();
    });
    view.rerender(<SortableList items={ITEMS} onReorder={onReorder} label="List" />);
    expect(styleOf("C")).toMatchObject({ zIndex: 0 });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("draws the caller's row and moves nothing when dropped in place or locked", () => {
    const onReorder = vi.fn();
    render(
      <SortableList
        items={ITEMS}
        onReorder={onReorder}
        label="List"
        isDisabled
        renderItem={(item) => <b>{`row ${item.id}`}</b>}
      />,
    );
    expect(screen.getByText("row a")).toBeTruthy();
    expect(state.rows.every((row) => row["accessibilityActions"] === undefined)).toBe(true);
    const first = state.responders[0] as Config;
    first["onPanResponderGrant"]?.();
    first["onPanResponderRelease"]?.();
    expect(onReorder).not.toHaveBeenCalled();
  });
});
