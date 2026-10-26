/**
 * Stackra file contract:
 * Purpose: proves the native SwipeableTabs names its tab list from `label` as the accessibility label, leaves it out
 *          when the caller did, passes every other prop, the `variant` and the imperative `ref` through, exposes
 *          HeroUI Native Pro's own parts and hook, and refuses its accessibility label names.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-011
import { render } from "@testing-library/react";
import {
  SwipeableTabs as HeroSwipeableTabs,
  useSwipeableTabs as heroUseSwipeableTabs,
} from "heroui-native-pro/swipeable-tabs";
import { createRef, type ReactNode } from "react";

import type { SwipeableTabsListContractProps } from "#contracts/types/swipeable-tabs-contract-props.type";
import { SwipeableTabs, useSwipeableTabs } from "#native/swipeable-tabs/swipeable-tabs";
import type { SwipeableTabsListProps } from "#native/swipeable-tabs/swipeable-tabs-list.props";

/** The props the root and the list stand-ins were last handed, as the real components would receive them. */
const received = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  list: {} as Record<string, unknown>,
}));

vi.mock("heroui-native-pro/swipeable-tabs", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const recording = (key: "root" | "list") => (props: Record<string, unknown>) => {
    received[key] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    SwipeableTabs: Object.assign(recording("root"), {
      List: recording("list"),
      ListBackground: part(),
      ScrollView: part(),
      Trigger: part(),
      Label: part(),
      Separator: part(),
      Indicator: part(),
      Pager: part(),
      Content: part(),
    }),
    useSwipeableTabs: () => ({}),
  };
});

describe("SwipeableTabs (native)", () => {
  beforeEach(() => {
    received.root = {};
    received.list = {};
  });

  it("passes the root's props, the variant and the imperative ref through unchanged", () => {
    const onValueChange = vi.fn();
    const ref = createRef<React.ComponentRef<typeof HeroSwipeableTabs>>();
    render(
      <SwipeableTabs
        ref={ref}
        variant="secondary"
        defaultValue="home"
        onValueChange={onValueChange}
        testID="found"
      />,
    );
    expect(received.root).toMatchObject({
      ref,
      variant: "secondary",
      defaultValue: "home",
      onValueChange,
      testID: "found",
    });
  });

  it("maps the list's label to the accessibility label, and passes its other props through", () => {
    render(<SwipeableTabs.List label="Sections" testID="found" />);
    expect(received.list).toMatchObject({ accessibilityLabel: "Sections", testID: "found" });
    expect(received.list).not.toHaveProperty("label");
  });

  it("leaves the list unnamed when no label is given", () => {
    render(<SwipeableTabs.List />);
    expect(received.list).not.toHaveProperty("accessibilityLabel");
  });

  it.each([
    "ListBackground",
    "ScrollView",
    "Trigger",
    "Label",
    "Separator",
    "Indicator",
    "Pager",
    "Content",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(SwipeableTabs[name]).toBe(HeroSwipeableTabs[name]);
  });

  it("exposes HeroUI Native Pro's own hook", () => {
    expect(useSwipeableTabs).toBe(heroUseSwipeableTabs);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<SwipeableTabsListProps>().toExtend<SwipeableTabsListContractProps>();
    // @ts-expect-error the list's accessible name is `label`
    void (<SwipeableTabs.List accessibilityLabel="x" />);
  });
});
