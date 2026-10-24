/**
 * Stackra file contract:
 * Purpose: proves the native ToggleButtonGroup hands HeroUI Native Pro's ToggleButtonGroup its mapped props, leaves out what the caller
 *          left out, passes every other prop through.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-007
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ToggleButtonGroupContractProps } from "#contracts/types/toggle-button-group-contract-props.type";
import {
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
} from "#native/toggle-button-group/toggle-button-group";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/toggle-button-group", async () => {
  const { createElement } = await import("react");
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return { ToggleButtonGroup: root };
});

describe("ToggleButtonGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro the mapped props", () => {
    render(
      <ToggleButtonGroup label="Text style" size="lg" isDisabled isFullWidth>
        <></>
      </ToggleButtonGroup>,
    );
    expect(received.props).toMatchObject({
      accessibilityLabel: "Text style",
      size: "lg",
      isDisabled: true,
      fullWidth: true,
    });
    expect(received.props).not.toHaveProperty("isFullWidth");
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(
      <ToggleButtonGroup>
        <></>
      </ToggleButtonGroup>,
    );
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
    expect(received.props).not.toHaveProperty("size");
    expect(received.props).not.toHaveProperty("fullWidth");
  });

  it("passes every other prop through unchanged", () => {
    const onSelectionChange = vi.fn();
    render(
      <ToggleButtonGroup
        selectionMode="multiple"
        selectedKeys={["bold"]}
        orientation="vertical"
        onSelectionChange={onSelectionChange}
        testID="found"
      >
        <></>
      </ToggleButtonGroup>,
    );
    expect(received.props).toMatchObject({
      selectionMode: "multiple",
      selectedKeys: ["bold"],
      orientation: "vertical",
      onSelectionChange,
      testID: "found",
    });
  });

  it("extends its contract", () => {
    expectTypeOf<ToggleButtonGroupProps>().toExtend<ToggleButtonGroupContractProps>();
    const named: ToggleButtonGroupProps = {
      children: null,
      // @ts-expect-error the accessible name is `label`
      accessibilityLabel: "x",
    };
    const wide: ToggleButtonGroupProps = {
      children: null,
      // @ts-expect-error the full-width flag is `isFullWidth`
      fullWidth: true,
    };
    expect([named, wide]).toHaveLength(2);
  });
});
