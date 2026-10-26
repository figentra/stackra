/**
 * Stackra file contract:
 * Purpose: proves the native SocialAuthButton hands HeroUI Native Pro's SocialAuthButton its mapped props, leaves out what the caller
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

import type { SocialAuthButtonContractProps } from "#contracts/types/social-auth-button-contract-props.type";
import { SocialAuthButton } from "#native/social-auth-button/social-auth-button";
import type { SocialAuthButtonProps } from "#native/social-auth-button/social-auth-button.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/social-auth-button", async () => {
  const { createElement } = await import("react");
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return { SocialAuthButton: root };
});

describe("SocialAuthButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro the mapped props", () => {
    render(<SocialAuthButton provider="google" size="sm" isDisabled />);
    expect(received.props).toMatchObject({ size: "sm", isDisabled: true });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<SocialAuthButton provider="google" />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("size");
  });

  it("passes every other prop through unchanged", () => {
    const onPress = vi.fn();
    render(
      <SocialAuthButton
        provider="github"
        label="Login via GitHub"
        variant="outline"
        onPress={onPress}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      provider: "github",
      label: "Login via GitHub",
      variant: "outline",
      onPress,
      testID: "found",
    });
  });

  it("extends its contract", () => {
    expectTypeOf<SocialAuthButtonProps>().toExtend<SocialAuthButtonContractProps>();
  });
});
