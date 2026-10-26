/**
 * Stackra file contract:
 * Purpose: proves the native FloatingActionButton hands HeroUI Native Pro's FAB its mapped props, leaves out what the caller
 *          left out, passes every other prop through, and exposes HeroUI Native Pro's own seven parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-007
import { render } from "@testing-library/react";
import { FAB as HeroFloatingActionButton } from "heroui-native-pro/fab";
import type { ReactNode } from "react";

import type { FloatingActionButtonContractProps } from "#contracts/types/floating-action-button-contract-props.type";
import { FloatingActionButton } from "#native/floating-action-button/floating-action-button";
import type { FloatingActionButtonProps } from "#native/floating-action-button/floating-action-button.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/fab", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    FAB: Object.assign(root, {
      Trigger: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      Item: part(),
      ItemBackground: part(),
      ItemLabel: part(),
    }),
  };
});

describe("FloatingActionButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro the mapped props", () => {
    render(<FloatingActionButton label="Create" isDisabled />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Create", isDisabled: true });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<FloatingActionButton />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onOpenChange = vi.fn();
    render(
      <FloatingActionButton
        placement="top"
        align="end"
        isOpen
        onOpenChange={onOpenChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      placement: "top",
      align: "end",
      isOpen: true,
      onOpenChange,
      testID: "found",
    });
  });

  it.each([
    "Trigger",
    "Portal",
    "Overlay",
    "Content",
    "Item",
    "ItemBackground",
    "ItemLabel",
  ] as const)("exposes HeroUI Native Pro's own %s", (part) => {
    expect(FloatingActionButton[part]).toBe(HeroFloatingActionButton[part]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<FloatingActionButtonProps>().toExtend<FloatingActionButtonContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<FloatingActionButton accessibilityLabel="x" />);
  });
});
