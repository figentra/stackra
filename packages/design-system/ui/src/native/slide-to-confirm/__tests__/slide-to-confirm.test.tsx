/**
 * Stackra file contract:
 * Purpose: proves the native SlideToConfirm: it is one button named by its words with an `activate` action; the
 *          thumb follows a sideways drag within the measured travel, a release short of 90% springs back, a release
 *          past it confirms once with a success haptic, swaps to the confirmed words and check and locks the gesture;
 *          `isConfirmed` controls it, disabled refuses both paths, right to left mirrors the drag, the danger variant
 *          takes the danger colours and reduced motion moves without a spring.
 * Boundary: React Native, heroui-native, lucide and Reanimated do not run in vitest, so they are recording stand-ins
 *           that render plain DOM; PanResponder hands back its config so the test drives the gesture callbacks.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right to left); WCAG 2.2 SC 2.5.1 and 4.1.2; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { SlideToConfirm } from "#native/slide-to-confirm/slide-to-confirm";
import type { SlideToConfirmProps } from "#native/slide-to-confirm/slide-to-confirm.props";

type Gesture = { dx: number; dy: number };
type Responder = {
  onStartShouldSetPanResponder: () => boolean;
  onMoveShouldSetPanResponder: (event: unknown, gesture: Gesture) => boolean;
  onPanResponderMove: (event: unknown, gesture: Gesture) => void;
  onPanResponderRelease: (event: unknown, gesture: Gesture) => void;
  onPanResponderTerminate: () => void;
};

const state = vi.hoisted(() => ({
  reduced: false,
  values: [] as { value: number }[],
  sets: [] as unknown[],
  root: {} as Record<string, unknown>,
  thumb: {} as Record<string, unknown>,
  colors: [] as string[],
  icon: "",
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    PanResponder: { create: (config: Responder) => ({ panHandlers: { responder: config } }) },
    View: (props: Record<string, unknown>) => {
      state.root = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        if (props["responder"]) state.thumb = props;
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    useSharedValue: (initial: number) => {
      const ref = useRef<{ value: number } | null>(null);
      if (!ref.current) {
        const box = { value: initial };
        state.values.push(box);
        ref.current = box;
      }
      const box = ref.current;
      return {
        get: () => box.value,
        set: (next: number | { spring: number }) => {
          state.sets.push(next);
          box.value = typeof next === "number" ? next : next.spring;
        },
      };
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withSpring: (to: number) => ({ spring: to }),
  };
});
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (names: string[]) => {
    state.colors = names;
    return names.map((name) => `color:${name}`);
  },
}));
vi.mock("lucide-react-native", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) =>
      createElement(Fragment, null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", () => ({
  Icon: (props: { name: string }) => {
    state.icon = props.name;
    return null;
  },
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const responder = () => (state.thumb["responder"] ?? {}) as Responder;
const offset = () => state.values.at(-2)?.value;
const draw = (props: Partial<SlideToConfirmProps> = {}, direction: "ltr" | "rtl" = "ltr") => {
  const result = render(
    <DesignSystemContext value={{ direction } as DesignSystemState}>
      <SlideToConfirm label="Slide to pay" confirmedLabel="Paid" {...props} />
    </DesignSystemContext>,
  );
  // 256 wide leaves 200 points of travel after the 48-point thumb and its padding.
  act(() =>
    (state.root["onLayout"] as (event: unknown) => void)({
      nativeEvent: { layout: { width: 256 } },
    }),
  );
  return result;
};
const release = (dx: number) =>
  act(() => {
    responder().onPanResponderMove(null, { dx, dy: 0 });
    responder().onPanResponderRelease(null, { dx, dy: 0 });
  });

beforeEach(() => {
  state.reduced = false;
  state.values.length = 0;
  state.sets.length = 0;
  state.root = {};
  state.thumb = {};
  state.played.length = 0;
});

describe("SlideToConfirm (native)", () => {
  it("is one button named by its words with an activate action", () => {
    draw({ className: "wide" });
    expect(state.root).toMatchObject({
      accessible: true,
      accessibilityRole: "button",
      accessibilityLabel: "Slide to pay",
      accessibilityState: { disabled: false, checked: false },
      accessibilityActions: [{ name: "activate" }],
    });
    expect(String(state.root["className"])).toContain("wide");
    expect(state.icon).toBe("chevrons-right");
    expect(state.colors).toEqual(["accent", "accent-foreground"]);
  });

  it("claims a sideways drag and follows it within the travel", () => {
    draw();
    expect(responder().onStartShouldSetPanResponder()).toBe(true);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 10, dy: 2 })).toBe(true);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 2, dy: 10 })).toBe(false);
    act(() => responder().onPanResponderMove(null, { dx: 500, dy: 0 }));
    expect(offset()).toBe(200);
    act(() => responder().onPanResponderMove(null, { dx: -50, dy: 0 }));
    expect(offset()).toBe(0);
  });

  it("springs back on a short release or a cancelled drag", () => {
    const onConfirm = vi.fn();
    draw({ onConfirm });
    release(150);
    expect(state.sets.at(-1)).toEqual({ spring: 0 });
    act(() => responder().onPanResponderTerminate());
    expect(state.sets.at(-1)).toEqual({ spring: 0 });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms once past 90% with a success haptic, then shows its confirmed words and locks", () => {
    const onConfirm = vi.fn();
    draw({ onConfirm });
    release(190);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(state.played).toEqual(["success"]);
    expect(screen.getByText("Paid")).toBeTruthy();
    expect(state.icon).toBe("check");
    expect(state.root["accessibilityState"]).toEqual({ disabled: false, checked: true });
    expect(responder().onStartShouldSetPanResponder()).toBe(false);
    act(() =>
      (state.root["onAccessibilityAction"] as (event: unknown) => void)({
        nativeEvent: { actionName: "activate" },
      }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("confirms from the reader's activate action and ignores other actions", () => {
    const onConfirm = vi.fn();
    draw({ onConfirm });
    const act11y = state.root["onAccessibilityAction"] as (event: unknown) => void;
    act(() => act11y({ nativeEvent: { actionName: "escape" } }));
    expect(onConfirm).not.toHaveBeenCalled();
    act(() => act11y({ nativeEvent: { actionName: "activate" } }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("refuses the drag and the action while disabled", () => {
    const onConfirm = vi.fn();
    draw({ onConfirm, isDisabled: true });
    expect(String(state.root["className"])).toContain("opacity-50");
    expect(responder().onStartShouldSetPanResponder()).toBe(false);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 10, dy: 0 })).toBe(false);
    act(() =>
      (state.root["onAccessibilityAction"] as (event: unknown) => void)({
        nativeEvent: { actionName: "activate" },
      }),
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("is controlled by isConfirmed and keeps the label without confirmed words", () => {
    draw({ isConfirmed: true, confirmedLabel: undefined });
    expect(state.root["accessibilityLabel"]).toBe("Slide to pay");
    expect(state.icon).toBe("check");
  });

  it("mirrors the drag right to left, takes the danger colours and moves without a spring when reduced", () => {
    state.reduced = true;
    const onConfirm = vi.fn();
    draw({ onConfirm, variant: "danger" }, "rtl");
    expect(state.colors).toEqual(["danger", "danger-foreground"]);
    release(-195);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(state.thumb["style"]).toContainEqual({ transform: [{ translateX: -200 }] });
    release(-10);
    expect(state.sets).not.toContainEqual({ spring: 0 });
  });
});
