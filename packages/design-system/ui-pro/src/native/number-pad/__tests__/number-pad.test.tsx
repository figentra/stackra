/**
 * Stackra file contract:
 * Purpose: proves the native NumberPad hands HeroUI Native Pro's NumberPad `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`maxLength` and `onComplete` among them), exposes HeroUI Native Pro's own parts and hook, and refuses
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
  NumberPad as HeroNumberPad,
  useNumberPad as HeroUseNumberPad,
} from "heroui-native-pro/number-pad";
import type { ReactNode } from "react";

import type { NumberPadContractProps } from "#contracts/types/number-pad-contract-props.type";
import { NumberPad, useNumberPad } from "#native/number-pad/number-pad";
import type { NumberPadProps } from "#native/number-pad/number-pad.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/number-pad", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    NumberPad: Object.assign(root, {
      Row: part(),
      Key: part(),
      KeyBackground: part(),
      KeyLabel: part(),
      Backspace: part(),
      Spacer: part(),
    }),
    useNumberPad: () => undefined,
  };
});

describe("NumberPad (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<NumberPad isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<NumberPad />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onComplete = vi.fn();
    render(<NumberPad maxLength={4} onComplete={onComplete} testID="found" />);
    expect(received.props).toMatchObject({ maxLength: 4, onComplete, testID: "found" });
  });

  it.each(["Row", "Key", "KeyBackground", "KeyLabel", "Backspace", "Spacer"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(NumberPad[name]).toBe(HeroNumberPad[name]);
    },
  );

  it("re-exports HeroUI Native Pro's own hook", () => {
    expect(useNumberPad).toBe(HeroUseNumberPad);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<NumberPadProps>().toExtend<NumberPadContractProps>();
    expectTypeOf<NumberPadProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<NumberPadProps>().not.toHaveProperty("aria-label");
  });
});
