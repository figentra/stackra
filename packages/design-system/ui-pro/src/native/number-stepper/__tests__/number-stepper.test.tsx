/**
 * Stackra file contract:
 * Purpose: proves the native NumberStepper hands HeroUI Native Pro's NumberStepper `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`value`, the bounds, `step` and `onValueChange` among them), exposes HeroUI Native Pro's own parts and hook, and refuses
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
  NumberStepper as HeroNumberStepper,
  useNumberStepper as HeroUseNumberStepper,
} from "heroui-native-pro/number-stepper";
import type { ReactNode } from "react";

import type { NumberStepperContractProps } from "#contracts/types/number-stepper-contract-props.type";
import { NumberStepper, useNumberStepper } from "#native/number-stepper/number-stepper";
import type { NumberStepperProps } from "#native/number-stepper/number-stepper.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/number-stepper", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    NumberStepper: Object.assign(root, {
      RootBackground: part(),
      DecrementButton: part(),
      ButtonBackground: part(),
      Value: part(),
      IncrementButton: part(),
    }),
    useNumberStepper: () => undefined,
  };
});

describe("NumberStepper (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<NumberStepper isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<NumberStepper />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    render(
      <NumberStepper
        value={4}
        minValue={0}
        maxValue={9}
        step={2}
        onValueChange={onValueChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value: 4,
      minValue: 0,
      maxValue: 9,
      step: 2,
      onValueChange,
      testID: "found",
    });
  });

  it.each([
    "RootBackground",
    "DecrementButton",
    "ButtonBackground",
    "Value",
    "IncrementButton",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(NumberStepper[name]).toBe(HeroNumberStepper[name]);
  });

  it("re-exports HeroUI Native Pro's own hook", () => {
    expect(useNumberStepper).toBe(HeroUseNumberStepper);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<NumberStepperProps>().toExtend<NumberStepperContractProps>();
    expectTypeOf<NumberStepperProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<NumberStepperProps>().not.toHaveProperty("aria-label");
  });
});
