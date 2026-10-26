/**
 * Stackra file contract:
 * Purpose: proves the native NumberField hands HeroUI Native Pro's NumberField `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with a plain number value, and exposes HeroUI Native Pro's own four parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-012
import { render } from "@testing-library/react";
import { NumberField as HeroNumberField } from "heroui-native-pro/number-field";
import type { ReactNode } from "react";

import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import { NumberField } from "#native/number-field/number-field";
import type { NumberFieldProps } from "#native/number-field/number-field.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/number-field", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    NumberField: Object.assign(root, {
      Group: part(),
      Input: part(),
      DecrementButton: part(),
      IncrementButton: part(),
    }),
  };
});

describe("NumberField (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<NumberField isDisabled label="Quantity" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Quantity" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<NumberField />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onChange = vi.fn();
    render(
      <NumberField
        value={4}
        minValue={0}
        maxValue={10}
        step={2}
        formatOptions={{ style: "percent" }}
        isInvalid
        onChange={onChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value: 4,
      minValue: 0,
      maxValue: 10,
      step: 2,
      formatOptions: { style: "percent" },
      isInvalid: true,
      onChange,
      testID: "found",
    });
  });

  it.each(["Group", "Input", "DecrementButton", "IncrementButton"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(NumberField[name]).toBe(HeroNumberField[name]);
    },
  );

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<NumberFieldProps>().toExtend<NumberFieldContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<NumberField accessibilityLabel="x" />);
  });
});
