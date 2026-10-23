/**
 * Stackra file contract:
 * Purpose: proves the native CloseButton names itself by `label`, leaves HeroUI Native's close mark unless an icon
 *          replaces it, passes `iconProps`, `size`, `hitSlop` and `feedbackVariant` through, hands over its disabled
 *          flag and press, and that the type refuses a missing label.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-023 sta-350:FR-024 sta-350:P-016
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import { CloseButton, type CloseButtonProps } from "#native/close-button/close-button";

/** The props the stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    CloseButton: (props: Record<string, unknown>) => {
      received.props = props;
      return createElement("div", { "data-testid": "close" }, props["children"] as ReactNode);
    },
  };
});

describe("CloseButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("names itself by label", () => {
    render(<CloseButton label="Dismiss" />);
    expect(received.props["accessibilityLabel"]).toBe("Dismiss");
  });

  it("leaves HeroUI Native's close mark without an icon and draws the given icon in its place", () => {
    const { container } = render(<CloseButton label="Dismiss" />);
    expect(received.props["children"]).toBeUndefined();
    expect(container.querySelector("i")).toBeNull();
    const second = render(<CloseButton label="Dismiss" icon={<i data-testid="mine" />} />);
    expect(second.container.querySelector('[data-testid="mine"]')).toBeTruthy();
  });

  it("passes the icon props, size, hit slop and feedback variant through", () => {
    render(
      <CloseButton
        label="Dismiss"
        iconProps={{ size: 22 }}
        size="lg"
        hitSlop={20}
        feedbackVariant="none"
        animation="disable-all"
      />,
    );
    expect(received.props).toMatchObject({
      iconProps: { size: 22 },
      size: "lg",
      hitSlop: 20,
      feedbackVariant: "none",
      animation: "disable-all",
    });
  });

  it("hands over the disabled flag and the press, and leaves them out when not given", () => {
    const onPress = vi.fn();
    render(<CloseButton label="Dismiss" isDisabled onPress={onPress} />);
    expect(received.props).toMatchObject({ isDisabled: true, onPress });
    render(<CloseButton label="Dismiss" />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("onPress");
  });

  it("requires a label", () => {
    expectTypeOf<CloseButtonProps>().toExtend<CloseButtonContractProps>();
    // @ts-expect-error HeroUI Native sets no name, so the type asks for one
    void (<CloseButton />);
  });
});
