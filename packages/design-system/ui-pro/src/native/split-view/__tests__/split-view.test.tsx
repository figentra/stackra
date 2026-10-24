/**
 * Stackra file contract:
 * Purpose: proves the native SplitView names its drag area from `label` as the accessibility label, leaves it out when
 *          the caller did, passes every other prop through (snap points and snap index included), exposes HeroUI
 *          Native Pro's own parts and hook, and refuses its accessibility label names.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-011
import { render } from "@testing-library/react";
import {
  SplitView as HeroSplitView,
  useSplitView as heroUseSplitView,
} from "heroui-native-pro/split-view";
import type { ReactNode } from "react";

import type { SplitViewDragAreaContractProps } from "#contracts/types/split-view-contract-props.type";
import {
  SplitView,
  useSplitView,
  type SplitViewDragAreaProps,
} from "#native/split-view/split-view";

/** The props the root and the drag area stand-ins were last handed, as the real components would receive them. */
const received = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  dragArea: {} as Record<string, unknown>,
}));

vi.mock("heroui-native-pro/split-view", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const recording = (key: "root" | "dragArea") => (props: Record<string, unknown>) => {
    received[key] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    SplitView: Object.assign(recording("root"), {
      TopSection: part(),
      DragArea: recording("dragArea"),
      DragHandle: part(),
      BottomSection: part(),
    }),
    useSplitView: () => ({}),
  };
});

describe("SplitView (native)", () => {
  beforeEach(() => {
    received.root = {};
    received.dragArea = {};
  });

  it("passes the root's props through unchanged", () => {
    const onSnapIndexChange = vi.fn();
    render(
      <SplitView
        snapPoints={[0.3, 0.6]}
        snapIndex={1}
        onSnapIndexChange={onSnapIndexChange}
        testID="found"
      />,
    );
    expect(received.root).toMatchObject({
      snapPoints: [0.3, 0.6],
      snapIndex: 1,
      onSnapIndexChange,
      testID: "found",
    });
  });

  it("maps the drag area's label to the accessibility label, and passes its other props through", () => {
    render(<SplitView.DragArea label="Resize panes" testID="found" />);
    expect(received.dragArea).toMatchObject({
      accessibilityLabel: "Resize panes",
      testID: "found",
    });
    expect(received.dragArea).not.toHaveProperty("label");
  });

  it("leaves the drag area unnamed when no label is given", () => {
    render(<SplitView.DragArea />);
    expect(received.dragArea).not.toHaveProperty("accessibilityLabel");
  });

  it.each(["TopSection", "DragHandle", "BottomSection"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(SplitView[name]).toBe(HeroSplitView[name]);
    },
  );

  it("exposes HeroUI Native Pro's own hook", () => {
    expect(useSplitView).toBe(heroUseSplitView);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<SplitViewDragAreaProps>().toExtend<SplitViewDragAreaContractProps>();
    // @ts-expect-error the drag area's accessible name is `label`
    void (<SplitView.DragArea accessibilityLabel="x" />);
  });
});
