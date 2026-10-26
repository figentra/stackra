/**
 * Stackra file contract:
 * Purpose: proves the native SwipeableRow hands HeroUI Native Pro's SwipeableRow `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop and the
 *          `ref` through, and exposes HeroUI Native Pro's own parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-010
import { render } from "@testing-library/react";
import { SwipeableRow as HeroSwipeableRow } from "heroui-native-pro/swipeable-row";
import { createRef, type ReactNode } from "react";

import type { SwipeableRowActionContractProps } from "#contracts/types/swipeable-row-action-contract-props.type";
import type { SwipeableRowContractProps } from "#contracts/types/swipeable-row-contract-props.type";
import { SwipeableRow } from "#native/swipeable-row/swipeable-row";
import type { SwipeableRowActionProps } from "#native/swipeable-row/swipeable-row-action.props";
import type { SwipeableRowProps } from "#native/swipeable-row/swipeable-row.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  action: {} as Record<string, unknown>,
}));

vi.mock("heroui-native-pro/swipeable-row", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    SwipeableRow: Object.assign(root, {
      Actions: part(),
      Content: part(),
      ContentBackground: part(),
      Action: (props: Record<string, unknown>) => {
        received.action = props;
        return createElement("div", null, props["children"] as ReactNode);
      },
      ActionLabel: part(),
    }),
  };
});

describe("SwipeableRow (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.action = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<SwipeableRow isDisabled label="Invoice 1042" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "Invoice 1042",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<SwipeableRow />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop, the layout variant and the imperative ref through unchanged", () => {
    const onOpenSideChange = vi.fn();
    const ref = createRef<React.ComponentRef<typeof HeroSwipeableRow>>();
    render(
      <SwipeableRow
        ref={ref}
        variant="inline"
        defaultOpenSide="end"
        closeOnContentPress={false}
        onOpenSideChange={onOpenSideChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      ref,
      variant: "inline",
      defaultOpenSide: "end",
      closeOnContentPress: false,
      onOpenSideChange,
      testID: "found",
    });
  });

  it.each(["default", "accent", "success", "danger"] as const)(
    "maps the action's tone %s to HeroUI Native Pro's variant",
    (tone) => {
      const onPress = vi.fn();
      render(<SwipeableRow.Action tone={tone} onPress={onPress} testID="found" />);
      expect(received.action).toMatchObject({ variant: tone, onPress, testID: "found" });
      expect(received.action).not.toHaveProperty("tone");
    },
  );

  it("leaves the action's variant to HeroUI Native Pro when no tone is given", () => {
    render(<SwipeableRow.Action />);
    expect(received.action).not.toHaveProperty("variant");
  });

  it.each(["Actions", "Content", "ContentBackground", "ActionLabel"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(SwipeableRow[name]).toBe(HeroSwipeableRow[name]);
    },
  );

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<SwipeableRowProps>().toExtend<SwipeableRowContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<SwipeableRow accessibilityLabel="x" />);
    expectTypeOf<SwipeableRowActionProps>().toExtend<SwipeableRowActionContractProps>();
    // @ts-expect-error the action's colour scheme is `tone`
    void (<SwipeableRow.Action variant="accent" />);
    // @ts-expect-error HeroUI's colour set has no `warning`
    void (<SwipeableRow.Action tone="warning" />);
  });
});
