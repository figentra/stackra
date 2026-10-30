/**
 * Stackra file contract:
 * Purpose: proves the native MessageScroller is a named, polite ScrollView that follows growth while at the bottom,
 *          stops once the person scrolls up and then offers "New messages" (or the count), and jumps back down,
 *          without animation under reduced motion, and counts the messages added since the person left.
 * Boundary: React Native's ScrollView, Reanimated's reduced-motion hook and the Button are recording stand-ins; scroll
 *           events are built by hand.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { MessageScroller } from "#native/message-scroller/message-scroller";

const state = vi.hoisted(() => ({
  reduced: false,
  scrolls: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  toEnd: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as never),
    ScrollView: forwardRef((props: Record<string, unknown>, ref) => {
      useImperativeHandle(ref, () => ({
        scrollToEnd: (options: unknown) => state.toEnd.push(options),
      }));
      state.scrolls.push(props);
      return createElement("div", null, props["children"] as never);
    }),
  };
});
vi.mock("react-native-reanimated", () => ({ useReducedMotion: () => state.reduced }));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));

/** A scroll event at `top` in 1000 of content with a 400 viewport. */
const at = (top: number) => ({
  nativeEvent: {
    contentOffset: { y: top },
    contentSize: { height: 1000 },
    layoutMeasurement: { height: 400 },
  },
});

const fire = (name: string, ...args: unknown[]) =>
  act(() => (state.scrolls.at(-1)?.[name] as (...values: unknown[]) => void)?.(...args));

describe("MessageScroller (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.buttons = [];
    state.toEnd = [];
  });

  it("is a named polite region that follows growth at the bottom", () => {
    render(<MessageScroller>hello</MessageScroller>);
    expect(state.scrolls.at(-1)).toMatchObject({
      accessibilityLabel: "Conversation",
      accessibilityLiveRegion: "polite",
    });
    fire("onContentSizeChange", 0, 1000);
    expect(state.toEnd).toEqual([{ animated: false }]);
    expect(state.buttons).toHaveLength(0);
  });

  it("stops following when scrolled up, offers the jump and goes back down", () => {
    state.reduced = true;
    render(<MessageScroller>hello</MessageScroller>);
    fire("onScroll", at(600));
    fire("onScroll", at(200));
    fire("onContentSizeChange", 0, 1400);
    expect(state.toEnd).toEqual([]);
    const button = state.buttons.at(-1) ?? {};
    expect(button["children"]).toBe("New messages");
    act(() => (button["onPress"] as () => void)());
    expect(state.toEnd).toEqual([{ animated: false }]);
  });

  it("counts the messages added since the person scrolled up", () => {
    const { rerender } = render(
      <MessageScroller>
        <p>One</p>
      </MessageScroller>,
    );
    fire("onScroll", at(600));
    fire("onScroll", at(200));
    rerender(
      <MessageScroller>
        <p>One</p>
        <p>Two</p>
        <p>Three</p>
      </MessageScroller>,
    );
    expect(state.buttons.at(-1)?.["children"]).toBe("2 new messages");
  });
});
