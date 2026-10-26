/**
 * Stackra file contract:
 * Purpose: proves the native ToggleButton hands HeroUI Native Pro's ToggleButton its mapped props, leaves out what the caller
 *          left out, passes every other prop through, and exposes HeroUI Native Pro's own one part.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-007
import { render } from "@testing-library/react";
import { ToggleButton as HeroToggleButton } from "heroui-native-pro/toggle-button";
import type { ReactNode } from "react";

import type { ToggleButtonContractProps } from "#contracts/types/toggle-button-contract-props.type";
import { ToggleButton } from "#native/toggle-button/toggle-button";
import type { ToggleButtonProps } from "#native/toggle-button/toggle-button.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/toggle-button", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    ToggleButton: Object.assign(root, {
      Label: part(),
    }),
  };
});

describe("ToggleButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro the mapped props", () => {
    render(<ToggleButton label="Bold" size="lg" isDisabled />);
    expect(received.props).toMatchObject({
      accessibilityLabel: "Bold",
      size: "lg",
      isDisabled: true,
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<ToggleButton />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
    expect(received.props).not.toHaveProperty("size");
  });

  it("passes every other prop through unchanged", () => {
    const onChange = vi.fn();
    render(
      <ToggleButton id="bold" variant="ghost" isSelected onChange={onChange} testID="found" />,
    );
    expect(received.props).toMatchObject({
      id: "bold",
      variant: "ghost",
      isSelected: true,
      onChange,
      testID: "found",
    });
  });

  it.each(["Label"] as const)("exposes HeroUI Native Pro's own %s", (part) => {
    expect(ToggleButton[part]).toBe(HeroToggleButton[part]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<ToggleButtonProps>().toExtend<ToggleButtonContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<ToggleButton accessibilityLabel="x" />);
  });
});
