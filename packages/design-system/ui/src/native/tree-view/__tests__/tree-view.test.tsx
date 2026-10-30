/**
 * Stackra file contract:
 * Purpose: proves the native TreeView hides children until their chevron button (named "Expand <row>") opens them,
 *          reports the expanded and selected ids in list order with a selection haptic, activates rows without
 *          selection, and starts the chevron pointing left in a right-to-left layout.
 * Boundary: jsdom with React Native, Reanimated, HeroUI Native and the house parts replaced by stand-ins.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 22.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { TreeView } from "#native/tree-view/tree-view";

const state = vi.hoisted(() => ({
  direction: "ltr",
  played: [] as string[],
  styles: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string | undefined },
        props["children"] as ReactNode,
      ),
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          "data-state": JSON.stringify(props["accessibilityState"]),
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain: object = new Proxy(() => chain, { get: () => chain, apply: () => chain });
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        if (props["style"] !== undefined) state.styles.push(props["style"]);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    FadeInDown: chain,
    useReducedMotion: () => true,
    useSharedValue: (value: unknown) => {
      let current = value;
      return { get: () => current, set: (next: unknown) => (current = next) };
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withTiming: (to: number) => to,
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: state.direction }),
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const CATEGORIES: readonly TreeViewNode[] = [
  {
    id: "drinks",
    label: "Drinks",
    children: [
      { id: "hot", label: "Hot" },
      { id: "cold", label: "Cold" },
    ],
  },
  { id: "food", label: "Food" },
];

describe("TreeView (native)", () => {
  beforeEach(() => {
    state.direction = "ltr";
    state.played = [];
    state.styles = [];
  });

  it("opens a parent with its named chevron button and reports the expanded ids", () => {
    const onExpandedChange = vi.fn();
    render(<TreeView items={CATEGORIES} label="Menu" onExpandedChange={onExpandedChange} />);
    expect(screen.queryByText("Hot")).toBeNull();
    act(() => screen.getByRole("button", { name: "Expand Drinks" }).click());
    expect(screen.getByText("Hot")).toBeTruthy();
    expect(onExpandedChange).toHaveBeenLastCalledWith(["drinks"]);
    expect(screen.getByRole("button", { name: "Collapse Drinks" })).toBeTruthy();
  });

  it("reports the selection in list order with a selection haptic", () => {
    const onSelectionChange = vi.fn();
    render(
      <TreeView
        items={CATEGORIES}
        label="Menu"
        selectionMode="multiple"
        defaultExpandedKeys={["drinks"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    act(() => screen.getByRole("button", { name: "Cold" }).click());
    act(() => screen.getByRole("button", { name: "Hot" }).click());
    expect(onSelectionChange).toHaveBeenLastCalledWith(["hot", "cold"]);
    expect(state.played).toEqual(["selection", "selection"]);
  });

  it("activates a row without selection, and starts the chevron pointing left in right-to-left", () => {
    state.direction = "rtl";
    const onAction = vi.fn();
    render(<TreeView items={CATEGORIES} label="Menu" onAction={onAction} />);
    act(() => screen.getByRole("button", { name: "Food" }).click());
    expect(onAction).toHaveBeenCalledWith("food");
    expect(state.styles.at(-1)).toEqual({ transform: [{ rotate: "180deg" }] });
  });
});
