/**
 * Stackra file contract:
 * Purpose: proves the native SlideButton hands HeroUI Native Pro's SlideButton `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through,
 *          and exposes HeroUI Native Pro's own six parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-009
import { render } from "@testing-library/react";
import { SlideButton as HeroSlideButton } from "heroui-native-pro/slide-button";
import type { ReactNode } from "react";

import type { SlideButtonContractProps } from "#contracts/types/slide-button-contract-props.type";
import { SlideButton, type SlideButtonProps } from "#native/slide-button/slide-button";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/slide-button", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    SlideButton: Object.assign(root, {
      UnderlayContent: part(),
      OverlayContent: part(),
      Thumb: part(),
      ThumbBackground: part(),
      ContainerBackground: part(),
      Label: part(),
    }),
  };
});

describe("SlideButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<SlideButton isDisabled label="Slide to pay" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "Slide to pay",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<SlideButton />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it.each(["default", "accent", "success", "danger"] as const)(
    "maps tone %s to HeroUI Native Pro's variant",
    (tone) => {
      render(<SlideButton tone={tone} />);
      expect(received.props).toMatchObject({ variant: tone });
      expect(received.props).not.toHaveProperty("tone");
    },
  );

  it("passes every other prop through unchanged", () => {
    const onComplete = vi.fn();
    render(
      <SlideButton completionThreshold={0.9} autoReset onComplete={onComplete} testID="found">
        <SlideButton.Thumb />
      </SlideButton>,
    );
    expect(received.props).toMatchObject({
      completionThreshold: 0.9,
      autoReset: true,
      onComplete,
      testID: "found",
    });
  });

  it.each([
    "UnderlayContent",
    "OverlayContent",
    "Thumb",
    "ThumbBackground",
    "ContainerBackground",
    "Label",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(SlideButton[name]).toBe(HeroSlideButton[name]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<SlideButtonProps>().toExtend<SlideButtonContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<SlideButton accessibilityLabel="x" />);
    // @ts-expect-error the colour scheme is `tone`
    void (<SlideButton variant="accent" />);
    // @ts-expect-error HeroUI's colour set has no `warning`
    void (<SlideButton tone="warning" />);
  });
});
