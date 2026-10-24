/**
 * Stackra file contract:
 * Purpose: proves the native ProgressBar hands HeroUI Native Pro `tone` as `color` and `label` as `accessibilityLabel`, leaves out what the
 *          caller left out, passes every other prop through, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/progress-bar subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  ProgressBar as HeroProgressBar,
  useProgressBar as heroUseProgressBar,
} from "heroui-native-pro/progress-bar";
import type { ReactNode } from "react";

import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import {
  ProgressBar,
  type ProgressBarProps,
  useProgressBar,
} from "#native/progress-bar/progress-bar";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/progress-bar", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    ProgressBar: Object.assign(root, {
      Track: part(),
      TrackBackground: part(),
      Fill: part(),
      Label: part(),
      ValueLabel: part(),
    }),
    useProgressBar: () => undefined,
  };
});

describe("ProgressBar (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "maps the tone %s to HeroUI Native Pro's color",
    (tone) => {
      render(<ProgressBar tone={tone} />);
      expect(received.props).toMatchObject({ color: tone });
      expect(received.props).not.toHaveProperty("tone");
    },
  );

  it("maps label to HeroUI Native Pro's accessibilityLabel", () => {
    render(<ProgressBar label="Upload progress" />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Upload progress" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<ProgressBar />);
    expect(received.props).not.toHaveProperty("color");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    render(
      <ProgressBar
        tone="success"
        value={40}
        minValue={0}
        maxValue={80}
        isDisabled
        size="lg"
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value: 40,
      minValue: 0,
      maxValue: 80,
      isDisabled: true,
      size: "lg",
      testID: "found",
    });
  });

  it.each(["Track", "TrackBackground", "Fill", "Label", "ValueLabel"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(ProgressBar[name]).toBe(HeroProgressBar[name]);
    },
  );

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useProgressBar).toBe(heroUseProgressBar);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<ProgressBarProps>().toExtend<ProgressBarContractProps>();
    // @ts-expect-error the colour role is `tone`
    void (<ProgressBar color="success" />);
    // @ts-expect-error the accessible name is `label`
    void (<ProgressBar accessibilityLabel="x" />);
  });
});
