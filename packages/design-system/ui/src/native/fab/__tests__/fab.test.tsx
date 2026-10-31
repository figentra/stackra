/**
 * Stackra file contract:
 * Purpose: proves the native Fab: one round icon button named by its label at the bottom-end corner by default, or an
 *          extended button with words; with actions it is a speed dial that says expanded, opens on press (turning
 *          the plus into a cross, or swapping another icon for an x), staggers its actions in with their labels
 *          hidden from the reader, runs a chosen action and closes, closes from the scrim, can be controlled, sits
 *          the labels after the buttons at the start corner and draws no scrim inline; reduced motion turns without
 *          timing.
 * Boundary: React Native, heroui-native and Reanimated do not run in vitest, so they and the house Button, IconButton,
 *           SlotIcon and Text are recording stand-ins that render plain DOM; what each is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (logical corners); WCAG 2.2 SC 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Fab } from "#native/fab/fab";
import type { FabProps } from "#native/fab/fab.props";

const state = vi.hoisted(() => ({
  reduced: false,
  sets: [] as unknown[],
  buttons: {} as Record<string, Record<string, unknown>>,
  main: {} as Record<string, unknown>,
  views: [] as Record<string, unknown>[],
  rows: [] as Record<string, unknown>[],
  icons: [] as unknown[],
}));

/** A chainable stand-in for Reanimated's layout-animation builders: every call returns the chain again. */
const motion = vi.hoisted(() => {
  const chain: object = new Proxy({}, { get: () => () => chain });
  return { chain };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    StyleSheet: { absoluteFill: { position: "absolute" } },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "data-testid": "scrim",
        onClick: props["onPress"] as () => void,
      }),
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        if (props["className"]) state.rows.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    FadeIn: motion.chain,
    FadeInDown: motion.chain,
    FadeOut: motion.chain,
    FadeOutDown: motion.chain,
    ReduceMotion: { System: "system" },
    useSharedValue: (initial: number) => ({
      get: () => initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
  };
});
vi.mock("heroui-native", () => ({ cn: (...names: unknown[]) => names.filter(Boolean).join(" ") }));
vi.mock("#native/slot-icon/slot-icon", () => ({
  SlotIcon: (props: { icon: unknown }) => {
    state.icons.push(props.icon);
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
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      state.main = props;
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["startIcon"] as ReactNode,
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      const label = props["label"] as string;
      state.buttons[label] = props;
      if (props["variant"] !== "secondary") state.main = props;
      return createElement(
        "button",
        { type: "button", "aria-label": label, onClick: props["onPress"] as () => void },
        typeof props["icon"] === "object" ? (props["icon"] as ReactNode) : null,
      );
    },
  };
});

const ACTIONS = [
  { id: "photo", label: "Photo", icon: "camera" as const, onPress: vi.fn() },
  { id: "note", label: "Note", icon: "file" as const },
];
const draw = (props: Partial<FabProps> = {}) => render(<Fab label="Create" {...props} />);
const root = () =>
  [...state.views].reverse().find((view) => view["pointerEvents"] === "box-none") ??
  ({} as Record<string, unknown>);

beforeEach(() => {
  state.reduced = false;
  state.sets.length = 0;
  state.buttons = {};
  state.main = {};
  state.views.length = 0;
  state.rows.length = 0;
  state.icons.length = 0;
});

describe("Fab (native)", () => {
  it("is one large primary round button at the bottom-end corner that runs onPress", () => {
    const onPress = vi.fn();
    draw({ onPress, className: "x", isDisabled: false });
    expect(state.main).toMatchObject({
      label: "Create",
      variant: "primary",
      size: "lg",
      className: "rounded-[var(--radius-pill)] shadow-overlay",
      isDisabled: false,
    });
    expect(state.main).not.toHaveProperty("accessibilityState");
    expect((root()["style"] as unknown[])[0]).toMatchObject({ position: "absolute", end: 16 });
    expect(state.icons).toContain("plus");
    fireEvent.click(screen.getByLabelText("Create"));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("is an extended button with its words", () => {
    draw({ isExtended: true, placement: "inline" });
    expect(screen.getByText("Create")).toBeTruthy();
    expect((root()["style"] as unknown[])[0]).toEqual({ alignItems: "flex-start" });
  });

  it("opens its dial on press with a scrim, turning the plus into a cross", () => {
    const onOpenChange = vi.fn();
    draw({ actions: ACTIONS, onOpenChange });
    expect(state.main["accessibilityState"]).toEqual({ expanded: false });
    fireEvent.click(screen.getByLabelText("Create"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(state.main["accessibilityState"]).toEqual({ expanded: true });
    expect(state.sets.at(-1)).toMatchObject({ timing: 45 });
    expect(screen.getByTestId("scrim")).toBeTruthy();
    expect(screen.getByText("Photo")).toBeTruthy();
    expect(state.rows.at(-1)?.["className"]).toContain("flex-row");
    expect(
      state.views.find(
        (view) =>
          view["className"] ===
          "rounded-[var(--radius-pill)] bg-overlay px-3 py-1.5 shadow-overlay",
      ),
    ).toMatchObject({ accessibilityElementsHidden: true });
  });

  it("runs a chosen action, reports it and closes", () => {
    const onAction = vi.fn();
    draw({ actions: ACTIONS, onAction, defaultOpen: true });
    fireEvent.click(screen.getByLabelText("Photo"));
    expect(ACTIONS[0]?.onPress).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("photo");
    expect(screen.queryByText("Photo")).toBeNull();
    fireEvent.click(screen.getByLabelText("Create"));
    fireEvent.click(screen.getByLabelText("Note"));
    expect(onAction).toHaveBeenLastCalledWith("note");
  });

  it("closes from the scrim", () => {
    draw({ actions: ACTIONS, defaultOpen: true });
    act(() => screen.getByTestId("scrim").click());
    expect(screen.queryByTestId("scrim")).toBeNull();
  });

  it("swaps another icon for an x when open and sits the labels after the buttons at the start", () => {
    draw({ actions: ACTIONS, icon: "pencil", isOpen: true, placement: "bottom-start" });
    expect(state.icons).toContain("x");
    expect(state.sets.at(-1)).toMatchObject({ timing: 0 });
    expect(state.rows.at(-1)?.["className"]).toContain("flex-row-reverse");
    expect((root()["style"] as unknown[])[0]).toMatchObject({ start: 16 });
  });

  it("draws no scrim inline and turns without timing under reduced motion", () => {
    state.reduced = true;
    draw({ actions: ACTIONS, defaultOpen: true, placement: "inline" });
    expect(screen.queryByTestId("scrim")).toBeNull();
    expect(state.sets.at(-1)).toBe(45);
  });

  it("is a plain button when the actions list is empty", () => {
    draw({ actions: [], placement: "bottom-center" });
    fireEvent.click(screen.getByLabelText("Create"));
    expect(state.main).not.toHaveProperty("accessibilityState");
    expect((root()["style"] as unknown[])[0]).toMatchObject({ alignItems: "center" });
  });
});
