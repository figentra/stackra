/**
 * Stackra file contract:
 * Purpose: proves the native ComboBox hands HeroUI Native Pro's ComboBox `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`menuTrigger`, `isInvalid` and `onClear` among them), exposes HeroUI Native Pro's own parts and hook, and refuses
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
  ComboBox as HeroComboBox,
  useComboBox as HeroUseComboBox,
} from "heroui-native-pro/combo-box";
import type { ReactNode } from "react";

import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import { ComboBox, useComboBox, type ComboBoxProps } from "#native/combo-box/combo-box";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/combo-box", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    ComboBox: Object.assign(root, {
      InputGroup: part(),
      Input: part(),
      Prefix: part(),
      Suffix: part(),
      Trigger: part(),
      TriggerIndicator: part(),
      ClearButton: part(),
      Value: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      ContentBackground: part(),
      List: part(),
      ListLabel: part(),
      Item: part(),
      ItemLabel: part(),
      ItemDescription: part(),
      ItemIndicator: part(),
      Empty: part(),
    }),
    useComboBox: () => undefined,
  };
});

describe("ComboBox (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<ComboBox isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<ComboBox />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onClear = vi.fn();
    render(<ComboBox menuTrigger="manual" isInvalid onClear={onClear} testID="found" />);
    expect(received.props).toMatchObject({
      menuTrigger: "manual",
      isInvalid: true,
      onClear,
      testID: "found",
    });
  });

  it.each([
    "InputGroup",
    "Input",
    "Prefix",
    "Suffix",
    "Trigger",
    "TriggerIndicator",
    "ClearButton",
    "Value",
    "Portal",
    "Overlay",
    "Content",
    "ContentBackground",
    "List",
    "ListLabel",
    "Item",
    "ItemLabel",
    "ItemDescription",
    "ItemIndicator",
    "Empty",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(ComboBox[name]).toBe(HeroComboBox[name]);
  });

  it("re-exports HeroUI Native Pro's own hook", () => {
    expect(useComboBox).toBe(HeroUseComboBox);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<ComboBoxProps>().toExtend<ComboBoxContractProps>();
    expectTypeOf<ComboBoxProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<ComboBoxProps>().not.toHaveProperty("aria-label");
  });
});
