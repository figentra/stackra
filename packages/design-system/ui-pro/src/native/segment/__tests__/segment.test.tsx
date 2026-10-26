/**
 * Stackra file contract:
 * Purpose: proves the native Segment hands HeroUI Native Pro's Segment the shared `size` and `isDisabled`, names the
 *          group from `label` as the accessibility label, leaves out what the caller left out, passes every other
 *          prop through, exposes HeroUI Native Pro's own parts and hook, and refuses its accessibility label name.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-011
import { render } from "@testing-library/react";
import { Segment as HeroSegment, useSegment as heroUseSegment } from "heroui-native-pro/segment";
import type { ReactNode } from "react";

import type { SegmentContractProps } from "#contracts/types/segment-contract-props.type";
import type { SegmentLabelContractProps } from "#contracts/types/segment-label-contract-props.type";
import { Segment, useSegment } from "#native/segment/segment";
import type { SegmentGroupProps } from "#native/segment/segment-group.props";
import type { SegmentProps } from "#native/segment/segment.props";

/** The props the root and the group stand-ins were last handed, as the real components would receive them. */
const received = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  group: {} as Record<string, unknown>,
}));

vi.mock("heroui-native-pro/segment", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const recording = (key: "root" | "group") => (props: Record<string, unknown>) => {
    received[key] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Segment: Object.assign(recording("root"), {
      Group: recording("group"),
      ScrollView: part(),
      Indicator: part(),
      Item: part(),
      Label: part(),
      Separator: part(),
    }),
    useSegment: () => ({}),
  };
});

describe("Segment (native)", () => {
  beforeEach(() => {
    received.root = {};
    received.group = {};
  });

  it("hands HeroUI Native Pro the shared size and isDisabled", () => {
    render(<Segment size="lg" isDisabled />);
    expect(received.root).toMatchObject({ size: "lg", isDisabled: true });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<Segment />);
    expect(received.root).not.toHaveProperty("size");
    expect(received.root).not.toHaveProperty("isDisabled");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    render(<Segment defaultValue="list" onValueChange={onValueChange} testID="found" />);
    expect(received.root).toMatchObject({ defaultValue: "list", onValueChange, testID: "found" });
  });

  it("maps the group's label to the accessibility label, and passes its other props through", () => {
    render(<Segment.Group label="View" testID="found" />);
    expect(received.group).toMatchObject({ accessibilityLabel: "View", testID: "found" });
    expect(received.group).not.toHaveProperty("label");
  });

  it("leaves the group unnamed when no label is given", () => {
    render(<Segment.Group />);
    expect(received.group).not.toHaveProperty("accessibilityLabel");
  });

  it.each(["ScrollView", "Indicator", "Item", "Label", "Separator"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(Segment[name]).toBe(HeroSegment[name]);
    },
  );

  it("exposes HeroUI Native Pro's own hook", () => {
    expect(useSegment).toBe(heroUseSegment);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<SegmentProps>().toExtend<SegmentContractProps>();
    expectTypeOf<SegmentGroupProps>().toExtend<SegmentLabelContractProps>();
    // @ts-expect-error the group's accessible name is `label`
    void (<Segment.Group accessibilityLabel="x" />);
    // @ts-expect-error the shared sizes are sm, md and lg
    void (<Segment size="xl" />);
  });
});
