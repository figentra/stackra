/**
 * Stackra file contract:
 * Purpose: proves the native Autocomplete hands HeroUI Native Pro's Autocomplete `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`isInvalid`, `isRequired` and `onClear` among them), exposes HeroUI Native Pro's own parts and hook, and refuses
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
  Autocomplete as HeroAutocomplete,
  useAutocomplete as HeroUseAutocomplete,
} from "heroui-native-pro/autocomplete";
import type { ReactNode } from "react";

import type { AutocompleteContractProps } from "#contracts/types/autocomplete-contract-props.type";
import { Autocomplete, useAutocomplete } from "#native/autocomplete/autocomplete";
import type { AutocompleteProps } from "#native/autocomplete/autocomplete.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/autocomplete", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Autocomplete: Object.assign(root, {
      Trigger: part(),
      Value: part(),
      TriggerIndicator: part(),
      ClearButton: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      ContentBackground: part(),
      SearchField: part(),
      List: part(),
      Item: part(),
      ItemLabel: part(),
      ItemDescription: part(),
      ItemIndicator: part(),
      ListLabel: part(),
      Empty: part(),
      Close: part(),
    }),
    useAutocomplete: () => undefined,
  };
});

describe("Autocomplete (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<Autocomplete isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<Autocomplete />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onClear = vi.fn();
    render(<Autocomplete isInvalid isRequired onClear={onClear} testID="found" />);
    expect(received.props).toMatchObject({
      isInvalid: true,
      isRequired: true,
      onClear,
      testID: "found",
    });
  });

  it.each([
    "Trigger",
    "Value",
    "TriggerIndicator",
    "ClearButton",
    "Portal",
    "Overlay",
    "Content",
    "ContentBackground",
    "SearchField",
    "List",
    "Item",
    "ItemLabel",
    "ItemDescription",
    "ItemIndicator",
    "ListLabel",
    "Empty",
    "Close",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Autocomplete[name]).toBe(HeroAutocomplete[name]);
  });

  it("re-exports HeroUI Native Pro's own hook", () => {
    expect(useAutocomplete).toBe(HeroUseAutocomplete);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<AutocompleteProps>().toExtend<AutocompleteContractProps>();
    expectTypeOf<AutocompleteProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<AutocompleteProps>().not.toHaveProperty("aria-label");
  });
});
