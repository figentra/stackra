/**
 * Stackra file contract:
 * Purpose: proves the native ProgressCircle hands HeroUI Native Pro `tone` as `color` and `label` as `accessibilityLabel`, leaves out what the
 *          caller left out, passes every other prop through, a numeric `size` included, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/progress-circle subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  ProgressCircle as HeroProgressCircle,
  useProgressCircle as heroUseProgressCircle,
} from "heroui-native-pro/progress-circle";
import type { ReactNode } from "react";

import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";
import {
  ProgressCircle,
  type ProgressCircleProps,
  useProgressCircle,
} from "#native/progress-circle/progress-circle";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/progress-circle", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    ProgressCircle: Object.assign(root, {
      Indicator: part(),
      ValueLabel: part(),
    }),
    useProgressCircle: () => undefined,
  };
});

describe("ProgressCircle (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "maps the tone %s to HeroUI Native Pro's color",
    (tone) => {
      render(<ProgressCircle tone={tone} />);
      expect(received.props).toMatchObject({ color: tone });
      expect(received.props).not.toHaveProperty("tone");
    },
  );

  it("maps label to HeroUI Native Pro's accessibilityLabel", () => {
    render(<ProgressCircle label="Loading" />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Loading" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<ProgressCircle />);
    expect(received.props).not.toHaveProperty("color");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    render(<ProgressCircle tone="danger" value={40} isIndeterminate size={48} testID="found" />);
    expect(received.props).toMatchObject({
      value: 40,
      isIndeterminate: true,
      size: 48,
      testID: "found",
    });
  });

  it.each(["Indicator", "ValueLabel"] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(ProgressCircle[name]).toBe(HeroProgressCircle[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useProgressCircle).toBe(heroUseProgressCircle);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<ProgressCircleProps>().toExtend<ProgressCircleContractProps>();
    // @ts-expect-error the colour role is `tone`
    void (<ProgressCircle color="danger" />);
    // @ts-expect-error the accessible name is `label`
    void (<ProgressCircle accessibilityLabel="x" />);
  });
});
