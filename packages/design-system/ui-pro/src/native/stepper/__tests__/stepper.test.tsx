/**
 * Stackra file contract:
 * Purpose: proves the native Stepper names its step list from `label` as the accessibility label, leaves it out when
 *          the caller did, passes every other prop through, exposes HeroUI Native Pro's own parts and hooks, and
 *          refuses its accessibility label names and the web-only `size`.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-011
import { render } from "@testing-library/react";
import {
  Stepper as HeroStepper,
  useStepper as heroUseStepper,
  useStepperAnimation as heroUseStepperAnimation,
  useStepperStep as heroUseStepperStep,
} from "heroui-native-pro/stepper";
import type { ReactNode } from "react";

import type { StepperContractProps } from "#contracts/types/stepper-contract-props.type";
import {
  Stepper,
  useStepper,
  useStepperAnimation,
  useStepperStep,
  type StepperProps,
} from "#native/stepper/stepper";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/stepper", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Stepper: Object.assign(root, {
      Step: part(),
      Rail: part(),
      Indicator: part(),
      IndicatorCheck: part(),
      IndicatorNumber: part(),
      Separator: part(),
      SeparatorTrack: part(),
      SeparatorFill: part(),
      Content: part(),
      Title: part(),
      Description: part(),
    }),
    useStepper: () => ({}),
    useStepperAnimation: () => ({}),
    useStepperStep: () => ({}),
  };
});

describe("Stepper (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to the accessibility label", () => {
    render(<Stepper label="Checkout">{[]}</Stepper>);
    expect(received.props).toMatchObject({ accessibilityLabel: "Checkout" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves the list unnamed when no label is given", () => {
    render(<Stepper>{[]}</Stepper>);
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onStepChange = vi.fn();
    render(
      <Stepper currentStep={1} orientation="vertical" onStepChange={onStepChange} testID="found">
        {[]}
      </Stepper>,
    );
    expect(received.props).toMatchObject({
      currentStep: 1,
      orientation: "vertical",
      onStepChange,
      testID: "found",
    });
  });

  it.each([
    "Step",
    "Rail",
    "Indicator",
    "IndicatorCheck",
    "IndicatorNumber",
    "Separator",
    "SeparatorTrack",
    "SeparatorFill",
    "Content",
    "Title",
    "Description",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Stepper[name]).toBe(HeroStepper[name]);
  });

  it("exposes HeroUI Native Pro's own hooks", () => {
    expect(useStepper).toBe(heroUseStepper);
    expect(useStepperAnimation).toBe(heroUseStepperAnimation);
    expect(useStepperStep).toBe(heroUseStepperStep);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<StepperProps>().toExtend<StepperContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<Stepper accessibilityLabel="x">{[]}</Stepper>);
    // @ts-expect-error HeroUI Native Pro's stepper has no size: it is web only
    void (<Stepper size="lg">{[]}</Stepper>);
  });
});
