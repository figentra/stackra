/**
 * Stackra file contract:
 * Purpose: proves the native PhoneNumberField hands HeroUI Native Pro's PhoneNumberField `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`defaultCountry`, `isInvalid` and `onValueChange` among them), exposes HeroUI Native Pro's own parts and hook, and refuses
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
  PhoneNumberField as HeroPhoneNumberField,
  usePhoneNumberField as HeroUsePhoneNumberField,
} from "heroui-native-pro/phone-number-field";
import type { ReactNode } from "react";

import type { PhoneNumberFieldContractProps } from "#contracts/types/phone-number-field-contract-props.type";
import {
  PhoneNumberField,
  usePhoneNumberField,
} from "#native/phone-number-field/phone-number-field";
import type { PhoneNumberFieldProps } from "#native/phone-number-field/phone-number-field.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/phone-number-field", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    PhoneNumberField: Object.assign(root, {
      Select: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      ContentBackground: part(),
      ContentHandle: part(),
      Trigger: part(),
      SearchInput: part(),
      CountryList: part(),
      CountryItem: part(),
      InputGroup: part(),
      Prefix: part(),
      Input: part(),
      Suffix: part(),
    }),
    usePhoneNumberField: () => undefined,
  };
});

describe("PhoneNumberField (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<PhoneNumberField isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<PhoneNumberField />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    render(
      <PhoneNumberField
        defaultCountry="GB"
        isInvalid
        onValueChange={onValueChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      defaultCountry: "GB",
      isInvalid: true,
      onValueChange,
      testID: "found",
    });
  });

  it.each([
    "Select",
    "Portal",
    "Overlay",
    "Content",
    "ContentBackground",
    "ContentHandle",
    "Trigger",
    "SearchInput",
    "CountryList",
    "CountryItem",
    "InputGroup",
    "Prefix",
    "Input",
    "Suffix",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(PhoneNumberField[name]).toBe(HeroPhoneNumberField[name]);
  });

  it("re-exports HeroUI Native Pro's own hook", () => {
    expect(usePhoneNumberField).toBe(HeroUsePhoneNumberField);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<PhoneNumberFieldProps>().toExtend<PhoneNumberFieldContractProps>();
    expectTypeOf<PhoneNumberFieldProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<PhoneNumberFieldProps>().not.toHaveProperty("aria-label");
  });
});
