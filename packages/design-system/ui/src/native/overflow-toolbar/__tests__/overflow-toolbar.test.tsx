/**
 * Stackra file contract:
 * Purpose: proves the native OverflowToolbar keeps every action until it has measured the row and the buttons, then
 *          keeps the leading ones that fit and hands the rest to an ActionMenu named by `moreLabel`, names the row as a
 *          toolbar, hides the measuring copy from assistive technology, and runs an action's handler then `onAction`.
 * Boundary: React Native and Reanimated do not run in vitest, so the View, the buttons, the ActionMenu and Reanimated
 *           are replaced by recording stand-ins that render plain DOM; layouts are fired by hand.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { OverflowToolbarContractProps } from "#contracts/types/overflow-toolbar-contract-props.type";
import { OverflowToolbar } from "#native/overflow-toolbar/overflow-toolbar";

const state = vi.hoisted(() => ({
  layouts: [] as ((event: unknown) => void)[],
  views: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  menu: undefined as Record<string, unknown> | undefined,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      if (props["onLayout"]) state.layouts.push(props["onLayout"] as (event: unknown) => void);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const builder: Record<string, () => unknown> = {};
  builder["duration"] = () => builder;
  builder["reduceMotion"] = () => builder;
  return {
    default: {
      View: ({ children }: { children?: ReactNode }) => createElement("div", null, children),
    },
    FadeIn: builder,
    FadeOut: builder,
    LinearTransition: builder,
    ReduceMotion: { System: "system" },
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      state.buttons.push(props);
      return createElement("button", { type: "button" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/icon-button/icon-button", () => ({ IconButton: () => null }));

vi.mock("#native/action-menu/action-menu", () => ({
  ActionMenu: (props: Record<string, unknown>) => {
    state.menu = props;
    return null;
  },
}));

const ITEMS: OverflowToolbarContractProps["items"] = [
  { id: "refund", label: "Refund" },
  { id: "print", label: "Print receipt" },
  { id: "void", label: "Void" },
];

/** Fires every recorded layout handler: the row gets `row` wide, every button 100. */
function layOut(row: number) {
  const [rowLayout, ...buttonLayouts] = state.layouts.slice(0, ITEMS.length + 2);
  act(() => {
    rowLayout?.({ nativeEvent: { layout: { width: row } } });
    for (const layout of buttonLayouts) layout({ nativeEvent: { layout: { width: 100 } } });
  });
}

describe("OverflowToolbar (native)", () => {
  beforeEach(() => {
    state.layouts = [];
    state.views = [];
    state.buttons = [];
    state.menu = undefined;
  });

  it("names the row as a toolbar and hides the measuring copy", () => {
    render(<OverflowToolbar label="Order actions" moreLabel="More" items={ITEMS} />);
    expect(state.views).toContainEqual(
      expect.objectContaining({
        accessibilityRole: "toolbar",
        accessibilityLabel: "Order actions",
      }),
    );
    expect(state.views).toContainEqual(
      expect.objectContaining({ importantForAccessibility: "no-hide-descendants" }),
    );
    expect(state.menu).toBeUndefined();
  });

  it("keeps the leading actions that fit and hands the rest to the more menu", () => {
    render(<OverflowToolbar label="Order actions" moreLabel="More" items={ITEMS} />);
    layOut(220);
    // 100 (more) + 108 fits one button in 220.
    expect(state.menu).toMatchObject({ label: "More" });
    const sections = state.menu?.["sections"] as { items: { id: string }[] }[];
    expect(sections[0]?.items.map((item) => item.id)).toEqual(["print", "void"]);
  });

  it("runs an action's handler and then onAction", () => {
    const calls: string[] = [];
    render(
      <OverflowToolbar
        label="Order actions"
        moreLabel="More"
        items={[{ id: "refund", label: "Refund", onPress: () => calls.push("press") }]}
        onAction={(id) => calls.push(id)}
      />,
    );
    const onPress = state.buttons.find((props) => typeof props["onPress"] === "function")?.[
      "onPress"
    ] as () => void;
    act(() => onPress());
    expect(calls).toEqual(["press", "refund"]);
  });
});
