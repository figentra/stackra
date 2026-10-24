/**
 * Stackra file contract:
 * Purpose: proves the native RadioButtonGroup hands HeroUI Native Pro's RadioButtonGroup `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`value`, `variant` and `onValueChange` among them), exposes HeroUI Native Pro's own parts and hooks, and refuses
 *          HeroUI's two spellings of the accessible name.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-010
import { render } from "@testing-library/react";
import {
  RadioButtonGroup as HeroRadioButtonGroup,
  useRadioButtonGroup as HeroUseRadioButtonGroup,
  useRadioButtonGroupItem as HeroUseRadioButtonGroupItem,
} from "heroui-native-pro/radio-button-group";
import type { ReactNode } from "react";

import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";
import {
  RadioButtonGroup,
  useRadioButtonGroup,
  useRadioButtonGroupItem,
  type RadioButtonGroupProps,
} from "#native/radio-button-group/radio-button-group";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/radio-button-group", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    RadioButtonGroup: Object.assign(root, {
      Item: part(),
      ItemBackground: part(),
      ItemContent: part(),
    }),
    useRadioButtonGroup: () => undefined,
    useRadioButtonGroupItem: () => undefined,
  };
});

describe("RadioButtonGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<RadioButtonGroup value="a" onValueChange={vi.fn()} isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<RadioButtonGroup value="a" onValueChange={vi.fn()} />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    render(
      <RadioButtonGroup
        value="a"
        variant="secondary"
        onValueChange={onValueChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value: "a",
      variant: "secondary",
      onValueChange,
      testID: "found",
    });
  });

  it.each(["Item", "ItemBackground", "ItemContent"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(RadioButtonGroup[name]).toBe(HeroRadioButtonGroup[name]);
    },
  );

  it("re-exports HeroUI Native Pro's own hooks", () => {
    expect(useRadioButtonGroup).toBe(HeroUseRadioButtonGroup);
    expect(useRadioButtonGroupItem).toBe(HeroUseRadioButtonGroupItem);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<RadioButtonGroupProps>().toExtend<RadioButtonGroupContractProps>();
    expectTypeOf<RadioButtonGroupProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<RadioButtonGroupProps>().not.toHaveProperty("aria-label");
  });
});
