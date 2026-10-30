/**
 * Stackra file contract:
 * Purpose: proves the native FullscreenBar shows its title, actions and a named exit that plays an impact haptic;
 *          slides away after `autoHideMs` (hidden from assistive technology, a named edge button left behind) and
 *          jumps under reduce motion; comes back on a tap at the edge, or, locked, only on a long press; and never
 *          hides with a screen reader on.
 * Boundary: React Native does not render in vitest, so react-native, Reanimated, safe areas, the icon parts, the
 *           text and the haptics are replaced by recording stand-ins that render plain DOM; `useUiText` echoes the key.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 32; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { FullscreenBar } from "#native/fullscreen-bar/fullscreen-bar";

const state = vi.hoisted(() => ({
  reduced: false,
  reader: false,
  bar: {} as Record<string, unknown>,
  edge: undefined as Record<string, unknown> | undefined,
  sets: [] as unknown[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    AccessibilityInfo: {
      isScreenReaderEnabled: () => Promise.resolve(state.reader),
      addEventListener: () => ({ remove: () => undefined }),
    },
    Pressable: (props: Record<string, unknown>) => {
      state.edge = props;
      return createElement("button", {
        type: "button",
        "aria-label": props["accessibilityLabel"] as string,
        onClick: props["onPress"] as () => void,
        onContextMenu: props["onLongPress"] as () => void,
      });
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.bar = props;
        return createElement("header", null, props["children"] as ReactNode);
      },
    },
    useSharedValue: (initial: number) => ({
      get: () => initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
  };
});
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 0, left: 0, right: 0 }),
}));
vi.mock("@stackra/icons/native", async () => {
  const { createElement } = await import("react");
  return {
    IconRegistryProvider: (props: { children: ReactNode }) =>
      createElement("span", null, props.children),
  };
});
vi.mock("#native/fullscreen-bar/fullscreen-bar-icons.constant", () => ({
  FULLSCREEN_BAR_ICONS: {},
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      }),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return { Text: (props: { children: ReactNode }) => createElement("p", null, props.children) };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

/** Lets the screen-reader query settle. */
const settle = () => act(async () => {});

describe("FullscreenBar (native)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.reduced = false;
    state.reader = false;
    state.sets = [];
    state.played = [];
    state.edge = undefined;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the title, the actions and an exit that plays an impact haptic", async () => {
    const onExit = vi.fn();
    render(<FullscreenBar title="KDS: grill" actions={<b>Lock</b>} onExit={onExit} />);
    await settle();
    expect(screen.getByText("KDS: grill")).toBeTruthy();
    expect(screen.getByText("Lock")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ui::fullscreen_bar.exit" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(state.played).toEqual(["impact"]);
    expect(state.bar["accessibilityElementsHidden"]).toBe(false);
  });

  it("slides away after the delay and comes back on a tap at the edge", async () => {
    render(<FullscreenBar title="POS" onExit={() => undefined} autoHideMs={1000} />);
    await settle();
    act(() => vi.advanceTimersByTime(1000));
    expect(state.bar["accessibilityElementsHidden"]).toBe(true);
    expect(state.bar["importantForAccessibility"]).toBe("no-hide-descendants");
    expect(state.sets.at(-1)).toEqual({ timing: 0 });
    fireEvent.click(screen.getByRole("button", { name: "ui::fullscreen_bar.reveal" }));
    expect(state.bar["accessibilityElementsHidden"]).toBe(false);
    expect(state.sets.at(-1)).toEqual({ timing: 1 });
  });

  it("jumps under reduce motion", async () => {
    state.reduced = true;
    render(<FullscreenBar title="POS" onExit={() => undefined} autoHideMs={1000} />);
    await settle();
    act(() => vi.advanceTimersByTime(1000));
    expect(state.sets.at(-1)).toBe(0);
  });

  it("locked, comes back only on a long press", async () => {
    render(<FullscreenBar title="Kiosk" onExit={() => undefined} autoHideMs={1000} isLocked />);
    await settle();
    act(() => vi.advanceTimersByTime(1000));
    const edge = screen.getByRole("button", { name: "ui::fullscreen_bar.reveal_locked" });
    expect(state.edge?.["onPress"]).toBeUndefined();
    fireEvent.contextMenu(edge);
    expect(state.bar["accessibilityElementsHidden"]).toBe(false);
  });

  it("never hides with a screen reader on", async () => {
    state.reader = true;
    render(<FullscreenBar title="POS" onExit={() => undefined} autoHideMs={1000} />);
    await settle();
    act(() => vi.advanceTimersByTime(5000));
    expect(state.bar["accessibilityElementsHidden"]).toBe(false);
  });
});
