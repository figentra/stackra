/**
 * Stackra file contract:
 * Purpose: proves the native ProgressButton hands HeroUI Native Pro's ProgressButton `isDisabled` and the accessible
 *          name (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop
 *          through, and exposes HeroUI Native Pro's own four parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-008
import { render } from "@testing-library/react";
import { ProgressButton as HeroProgressButton } from "heroui-native-pro/progress-button";
import type { ReactNode } from "react";

import type { ProgressButtonContractProps } from "#contracts/types/progress-button-contract-props.type";
import { ProgressButton, type ProgressButtonProps } from "#native/progress-button/progress-button";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/progress-button", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    ProgressButton: Object.assign(root, {
      Background: part(),
      Label: part(),
      Overlay: part(),
      MaskLabel: part(),
    }),
  };
});

describe("ProgressButton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(
      <ProgressButton isDisabled label="Hold to delete the draft">
        Hold
      </ProgressButton>,
    );
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "Hold to delete the draft",
      children: "Hold",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<ProgressButton>Hold</ProgressButton>);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it.each(["default", "accent", "success", "danger"] as const)(
    "maps tone %s to HeroUI Native Pro's variant",
    (tone) => {
      render(<ProgressButton tone={tone} />);
      expect(received.props).toMatchObject({ variant: tone });
      expect(received.props).not.toHaveProperty("tone");
    },
  );

  it("passes every other prop through unchanged", () => {
    const onComplete = vi.fn();
    render(
      <ProgressButton holdDuration={1000} autoReset onComplete={onComplete} testID="found">
        Hold
      </ProgressButton>,
    );
    expect(received.props).toMatchObject({
      holdDuration: 1000,
      autoReset: true,
      onComplete,
      testID: "found",
    });
  });

  it.each(["Background", "Label", "Overlay", "MaskLabel"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(ProgressButton[name]).toBe(HeroProgressButton[name]);
    },
  );

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<ProgressButtonProps>().toExtend<ProgressButtonContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<ProgressButton accessibilityLabel="x" />);
    // @ts-expect-error the colour scheme is `tone`
    void (<ProgressButton variant="accent" />);
    // @ts-expect-error HeroUI's colour set has no `warning`
    void (<ProgressButton tone="warning" />);
  });
});
