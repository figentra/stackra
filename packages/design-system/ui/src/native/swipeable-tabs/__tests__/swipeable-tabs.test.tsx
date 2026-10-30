/**
 * Stackra file contract:
 * Purpose: proves the native SwipeableTabs: it hands the house Tabs the first enabled tab (or `defaultSelectedKeys`),
 *          changes tab on a tab press, and on a swipe past the threshold steps to the next or previous enabled tab
 *          (sliding the panel in from that side), ignores short or vertical drags, the ends and disabled tabs, mirrors
 *          the swipe right to left, can be controlled, and writes string content as Text.
 * Boundary: React Native and Reanimated do not run in vitest, so they and the house Tabs and Text are recording
 *           stand-ins that render plain DOM; PanResponder hands back its config so the test drives the swipe.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right to left); WCAG 2.2 SC 2.5.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { SwipeableTabs } from "#native/swipeable-tabs/swipeable-tabs";
import type { SwipeableTabsProps } from "#native/swipeable-tabs/swipeable-tabs.props";

type Gesture = { dx: number; dy: number };
type Responder = {
  onMoveShouldSetPanResponder: (event: unknown, gesture: Gesture) => boolean;
  onPanResponderRelease: (event: unknown, gesture: Gesture) => void;
};

const state = vi.hoisted(() => ({
  tabs: {} as Record<string, unknown>,
  panels: [] as Record<string, unknown>[],
}));

/** A stand-in for Reanimated's slide builders: the chain ends in the side's name. */
const motion = vi.hoisted(() => ({
  slide: (name: string) => ({ duration: () => ({ reduceMotion: () => name }) }),
}));

vi.mock("react-native", () => ({
  I18nManager: { isRTL: false },
  PanResponder: { create: (config: Responder) => ({ panHandlers: { responder: config } }) },
}));
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const { slide } = motion;
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.panels.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    ReduceMotion: { System: "system" },
    SlideInLeft: slide("left"),
    SlideInRight: slide("right"),
  };
});
vi.mock("#native/tabs/tabs", async () => {
  const { createElement } = await import("react");
  return {
    Tabs: (props: { items: { id: string; content: ReactNode }[] } & Record<string, unknown>) => {
      state.tabs = props;
      const shown = (props["selectedKeys"] as string[])[0];
      return createElement(
        "div",
        null,
        props.items.filter((item) => item.id === shown).map((item) => item.content),
      );
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const ITEMS = [
  { id: "a", label: "A", content: "Panel A" },
  { id: "off", label: "Off", content: "Panel Off", isDisabled: true },
  { id: "b", label: "B", content: <b>Panel B</b> },
  { id: "c", label: "C", content: "Panel C" },
];
const draw = (props: Partial<SwipeableTabsProps> = {}, direction: "ltr" | "rtl" = "ltr") =>
  render(
    <DesignSystemContext value={{ direction } as DesignSystemState}>
      <SwipeableTabs label="Sections" items={ITEMS} {...props} />
    </DesignSystemContext>,
  );
const panel = () => state.panels.at(-1) ?? {};
const responder = () => panel()["responder"] as Responder;
const swipe = (dx: number) => act(() => responder().onPanResponderRelease(null, { dx, dy: 0 }));
const selected = () => state.tabs["selectedKeys"];

beforeEach(() => {
  state.tabs = {};
  state.panels.length = 0;
});

describe("SwipeableTabs (native)", () => {
  it("starts on the first enabled tab and writes string content as text", () => {
    draw();
    expect(selected()).toEqual(["a"]);
    expect(screen.getByText("Panel A")).toBeTruthy();
    expect(state.tabs).toMatchObject({ label: "Sections", isDisabled: false });
  });

  it("claims only a clear sideways drag, and nothing while disabled", () => {
    draw();
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 8, dy: 0 })).toBe(false);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 30, dy: 25 })).toBe(false);
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 30, dy: 2 })).toBe(true);
    draw({ isDisabled: true });
    expect(responder().onMoveShouldSetPanResponder(null, { dx: 30, dy: 2 })).toBe(false);
  });

  it("steps over a disabled tab on a swipe toward the end, sliding the panel in from the right", () => {
    const onSelectionChange = vi.fn();
    draw({ onSelectionChange });
    swipe(-60);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["b"]);
    expect(selected()).toEqual(["b"]);
    expect(panel()["entering"]).toBe("right");
    swipe(80);
    expect(selected()).toEqual(["a"]);
    expect(panel()["entering"]).toBe("left");
  });

  it("ignores a short swipe and a swipe past either end", () => {
    const onSelectionChange = vi.fn();
    draw({ onSelectionChange });
    swipe(30);
    swipe(80);
    expect(onSelectionChange).not.toHaveBeenCalled();
    draw({ onSelectionChange, defaultSelectedKeys: ["c"] });
    swipe(-80);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("changes tab on a tab press and ignores a press on the current or no tab", () => {
    const onSelectionChange = vi.fn();
    draw({ onSelectionChange });
    const change = state.tabs["onSelectionChange"] as (keys: string[]) => void;
    act(() => change(["a"]));
    act(() => change([]));
    expect(onSelectionChange).not.toHaveBeenCalled();
    act(() => change(["c"]));
    expect(onSelectionChange).toHaveBeenCalledWith(["c"]);
    expect(screen.getByText("Panel C")).toBeTruthy();
  });

  it("mirrors the swipe right to left", () => {
    draw({}, "rtl");
    swipe(60);
    expect(selected()).toEqual(["b"]);
    expect(panel()["entering"]).toBe("left");
  });

  it("is controlled by selectedKeys", () => {
    const onSelectionChange = vi.fn();
    draw({ selectedKeys: ["b"], onSelectionChange });
    swipe(-60);
    expect(onSelectionChange).toHaveBeenCalledWith(["c"]);
    expect(selected()).toEqual(["b"]);
  });

  it("selects nothing when every tab is disabled", () => {
    draw({ items: [{ id: "x", label: "X", content: "X", isDisabled: true }] });
    expect(selected()).toEqual([]);
  });
});
