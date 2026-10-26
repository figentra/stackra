/**
 * Stackra file contract:
 * Purpose: proves the native MorphButton hands HeroUI Native Pro's MorphButton its mapped props, leaves out what the caller
 *          left out, passes every other prop through, and exposes HeroUI Native Pro's own two parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-007
import { render } from "@testing-library/react";
import { MorphButton as HeroMorphButton } from "heroui-native-pro/morph-button";
import type { ReactNode } from "react";

import type { MorphButtonContractProps } from "#contracts/types/morph-button-contract-props.type";
import { MorphButton } from "#native/morph-button/morph-button";
import type { MorphButtonProps } from "#native/morph-button/morph-button.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/morph-button", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    MorphButton: Object.assign(root, {
      CollapsedContent: part(),
      ExpandedContent: part(),
    }),
  };
});

describe("MorphButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro the mapped props", () => {
    render(<MorphButton label="Compose" isDisabled />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Compose", isDisabled: true });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<MorphButton />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onOpenChange = vi.fn();
    render(
      <MorphButton
        direction="top-end"
        variant="secondary"
        isOpen
        onOpenChange={onOpenChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      direction: "top-end",
      variant: "secondary",
      isOpen: true,
      onOpenChange,
      testID: "found",
    });
  });

  it.each(["CollapsedContent", "ExpandedContent"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (part) => {
      expect(MorphButton[part]).toBe(HeroMorphButton[part]);
    },
  );

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<MorphButtonProps>().toExtend<MorphButtonContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<MorphButton accessibilityLabel="x" />);
  });
});
