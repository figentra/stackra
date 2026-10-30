/**
 * Stackra file contract:
 * Purpose: proves the native PullToRefresh: a scroll view whose refresh control is tinted with the accent and named
 *          by `label`; a pull plays a light haptic, shows the spinner until `onRefresh` settles,
 *          and `isRefreshing` controls the spinner.
 * Boundary: React Native and heroui-native do not run in vitest, so they are recording stand-ins that render plain DOM;
 *           the refresh control's props are recorded and its `onRefresh` driven directly.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { PullToRefresh } from "#native/pull-to-refresh/pull-to-refresh";

const state = vi.hoisted(() => ({
  scroll: {} as Record<string, unknown>,
  control: {} as Record<string, unknown>,
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    ScrollView: (props: Record<string, unknown>) => {
      state.scroll = props;
      return createElement(
        "div",
        null,
        props["refreshControl"] as ReactNode,
        props["children"] as ReactNode,
      );
    },
    RefreshControl: (props: Record<string, unknown>) => {
      state.control = props;
      return null;
    },
  };
});
vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

const pull = () => (state.control["onRefresh"] as () => void)();

beforeEach(() => {
  state.scroll = {};
  state.control = {};
  state.played.length = 0;
});

describe("PullToRefresh (native)", () => {
  it("tints its control with the accent, names it by the label and passes props to the scroll view", () => {
    render(
      <PullToRefresh onRefresh={() => undefined} label="Reload" testID="feed">
        <span>Items</span>
      </PullToRefresh>,
    );
    expect(state.scroll["testID"]).toBe("feed");
    expect(state.control).toMatchObject({
      refreshing: false,
      tintColor: "color:accent",
      colors: ["color:accent"],
      title: "Reload",
      accessibilityLabel: "Reload",
    });
  });

  it("spins until the refresh settles, with a light haptic", async () => {
    let settle: ((value: undefined) => void) | undefined;
    const pending = new Promise<undefined>((resolve) => {
      settle = resolve;
    });
    const onRefresh = vi.fn(() => pending);
    render(<PullToRefresh onRefresh={onRefresh}>x</PullToRefresh>);
    expect(state.control).not.toHaveProperty("title");
    act(() => pull());
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(state.played).toEqual(["light"]);
    expect(state.control["refreshing"]).toBe(true);
    await act(async () => settle?.(undefined));
    expect(state.control["refreshing"]).toBe(false);
  });

  it("is controlled by isRefreshing", () => {
    render(
      <PullToRefresh onRefresh={() => undefined} isRefreshing>
        x
      </PullToRefresh>,
    );
    expect(state.control["refreshing"]).toBe(true);
  });
});
