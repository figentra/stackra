/**
 * Stackra file contract:
 * Purpose: proves the native FlipCard hands HeroUI Native Pro `label` as `accessibilityLabel`, leaves out what the
 *          caller left out, passes every other prop through, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/flip-card subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  FlipCard as HeroFlipCard,
  useFlipCard as heroUseFlipCard,
  useFlipCardAnimation as heroUseFlipCardAnimation,
} from "heroui-native-pro/flip-card";
import type { ReactNode } from "react";

import type { FlipCardContractProps } from "#contracts/types/flip-card-contract-props.type";
import {
  FlipCard,
  type FlipCardProps,
  useFlipCard,
  useFlipCardAnimation,
} from "#native/flip-card/flip-card";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/flip-card", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    FlipCard: Object.assign(root, {
      Front: part(),
      Back: part(),
      FaceBackground: part(),
    }),
    useFlipCard: () => undefined,
    useFlipCardAnimation: () => undefined,
  };
});

describe("FlipCard (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to HeroUI Native Pro's accessibilityLabel", () => {
    render(<FlipCard label="Card with the answer" />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Card with the answer" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<FlipCard />);
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    render(
      <FlipCard
        label="Card with the answer"
        direction="vertical"
        rotation="reverse"
        isPressDisabled
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      direction: "vertical",
      rotation: "reverse",
      isPressDisabled: true,
      testID: "found",
    });
  });

  it.each(["Front", "Back", "FaceBackground"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(FlipCard[name]).toBe(HeroFlipCard[name]);
    },
  );

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useFlipCard).toBe(heroUseFlipCard);
    expect(useFlipCardAnimation).toBe(heroUseFlipCardAnimation);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<FlipCardProps>().toExtend<FlipCardContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<FlipCard accessibilityLabel="x" />);
  });
});
