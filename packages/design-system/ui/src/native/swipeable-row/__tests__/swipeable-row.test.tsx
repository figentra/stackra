/**
 * Stackra file contract:
 * Purpose: proves the native SwipeableRow: a sideways drag past the slop claims the gesture unless disabled, the row
 *          follows the finger within the actions' width, a release past half snaps open with a selection haptic and
 *          shows that side's actions to the reader, less than half snaps shut, a cancelled drag returns to rest;
 *          choosing an action (by press or by accessibility action) runs it, reports its id and closes the row; right
 *          to left mirrors the drag; reduced motion snaps without a spring.
 * Boundary: React Native, heroui-native, lucide and Reanimated do not run in vitest, so they are recording stand-ins
 *           that render plain DOM; PanResponder hands back its config so the test drives the gesture callbacks.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right to left); WCAG 2.2 SC 2.5.1 and 4.1.2; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { SwipeableRow } from "#native/swipeable-row/swipeable-row";
import type { SwipeableRowProps } from "#native/swipeable-row/swipeable-row.props";

type Gesture = { dx: number; dy: number };
type Responder = {
  onMoveShouldSetPanResponder: (event: unknown, gesture: Gesture) => boolean;
  onPanResponderMove: (event: unknown, gesture: Gesture) => void;
  onPanResponderRelease: () => void;
  onPanResponderTerminate: () => void;
};

const state = vi.hoisted(() => ({
  reduced: false,
  offset: 0,
  sets: [] as unknown[],
  views: [] as Record<string, unknown>[],
  row: {} as Record<string, unknown>,
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    PanResponder: { create: (config: Responder) => ({ panHandlers: { responder: config } }) },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          className: props["className"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.row = props;
        return createElement("div", null, props["children"] as ReactNode);
      },
      Text: (props: Record<string, unknown>) =>
        createElement("span", null, props["children"] as ReactNode),
    },
    useSharedValue: () => ({
      get: () => state.offset,
      set: (next: number | { spring: number }) => {
        state.sets.push(next);
        state.offset = typeof next === "number" ? next : next.spring;
      },
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withSpring: (to: number) => ({ spring: to }),
  };
});
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (name: string) => `color:${name}`,
}));
vi.mock("lucide-react-native", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) =>
      createElement(Fragment, null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const archive = vi.fn();
const START = [{ id: "pin", label: "Pin", icon: "pin" as const, tone: "accent" as const }];
const END = [
  { id: "archive", label: "Archive", onPress: archive },
  { id: "delete", label: "Delete", tone: "danger" as const },
];
const responder = () => (state.row["responder"] ?? {}) as Responder;
const draw = (props: Partial<SwipeableRowProps> = {}, direction: "ltr" | "rtl" = "ltr") =>
  render(
    <DesignSystemContext value={{ direction } as DesignSystemState}>
      <SwipeableRow startActions={START} endActions={END} {...props}>
        <span>Row</span>
      </SwipeableRow>
    </DesignSystemContext>,
  );
const drag = (dx: number) =>
  act(() => {
    responder().onPanResponderMove(null, { dx, dy: 0 });
    responder().onPanResponderRelease();
  });
const sideHidden = (index: number) =>
  state.views.filter((view) => view["className"] === "flex-row").at(index - 2)?.[
    "accessibilityElementsHidden"
  ];

beforeEach(() => {
  state.reduced = false;
  state.offset = 0;
  state.sets.length = 0;
  state.views.length = 0;
  state.row = {};
  state.played.length = 0;
  archive.mockClear();
});

describe("SwipeableRow (native)", () => {
  it("claims only a clear sideways drag past the slop, and nothing while disabled", () => {
    draw();
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 5, dy: 0 })).toBe(false);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 20, dy: 18 })).toBe(false);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: -30, dy: 2 })).toBe(true);
    draw({ isDisabled: true });
    expect(responder().onMoveShouldSetPanResponder(null, { dx: -30, dy: 2 })).toBe(false);
  });

  it("hides both sides from the reader at rest and offers every action as an accessibility action", () => {
    draw({ className: "row" });
    expect(sideHidden(0)).toBe(true);
    expect(sideHidden(1)).toBe(true);
    expect(state.row["accessibilityActions"]).toEqual([
      { name: "pin", label: "Pin" },
      { name: "archive", label: "Archive" },
      { name: "delete", label: "Delete" },
    ]);
    expect(screen.getByLabelText("Delete").className).toContain("bg-danger");
    expect(screen.getByLabelText("Archive").className).toContain("bg-default");
  });

  it("follows the finger within the end actions and snaps open past half with a haptic", () => {
    draw();
    act(() => responder().onPanResponderMove(null, { dx: -500, dy: 0 }));
    expect(state.offset).toBe(-152);
    drag(-100);
    expect(state.sets.at(-1)).toEqual({ spring: -152 });
    expect(state.played).toEqual(["selection"]);
    expect(sideHidden(1)).toBeUndefined();
    expect(sideHidden(0)).toBe(true);
  });

  it("snaps shut on a short drag and returns to rest when the drag is cancelled", () => {
    draw();
    drag(20);
    expect(state.offset).toBe(0);
    expect(state.played).toEqual([]);
    drag(60);
    expect(state.offset).toBe(76);
    act(() => {
      responder().onPanResponderMove(null, { dx: -200, dy: 0 });
      responder().onPanResponderTerminate();
    });
    expect(state.offset).toBe(76);
  });

  it("runs a pressed action, reports its id and closes the row", () => {
    const onAction = vi.fn();
    draw({ onAction });
    drag(-100);
    fireEvent.click(screen.getByLabelText("Archive"));
    expect(archive).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("archive");
    expect(state.offset).toBe(0);
  });

  it("runs an action from the reader's action menu and ignores an unknown one", () => {
    const onAction = vi.fn();
    draw({ onAction });
    const run = state.row["onAccessibilityAction"] as (event: unknown) => void;
    act(() => run({ nativeEvent: { actionName: "nope" } }));
    expect(onAction).not.toHaveBeenCalled();
    act(() => run({ nativeEvent: { actionName: "delete" } }));
    expect(onAction).toHaveBeenCalledWith("delete");
  });

  it("mirrors the drag right to left and snaps without a spring under reduced motion", () => {
    state.reduced = true;
    draw({}, "rtl");
    drag(-60);
    expect(state.sets.at(-1)).toBe(76);
    expect(state.row["style"]).toEqual({ transform: [{ translateX: -76 }] });
  });

  it("draws with no actions", () => {
    render(
      <SwipeableRow>
        <span>Bare</span>
      </SwipeableRow>,
    );
    expect(state.row["accessibilityActions"]).toEqual([]);
    drag(100);
    expect(state.offset).toBe(0);
  });
});
