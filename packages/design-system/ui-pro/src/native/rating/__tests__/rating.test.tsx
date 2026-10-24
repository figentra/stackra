/**
 * Stackra file contract:
 * Purpose: proves the native Rating hands HeroUI Native Pro `label` as `accessibilityLabel`, leaves out what the
 *          caller left out, passes every other prop through, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/rating subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import { Rating as HeroRating, useRating as heroUseRating } from "heroui-native-pro/rating";
import type { ReactNode } from "react";

import type { RatingContractProps } from "#contracts/types/rating-contract-props.type";
import { Rating, type RatingProps, useRating } from "#native/rating/rating";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/rating", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Rating: Object.assign(root, {
      Item: part(),
    }),
    useRating: () => undefined,
  };
});

describe("Rating (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to HeroUI Native Pro's accessibilityLabel", () => {
    render(<Rating label="Quality" />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Quality" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("passes every other prop through unchanged", () => {
    render(<Rating label="Quality" value={3} maxValue={5} isReadOnly size="lg" testID="found" />);
    expect(received.props).toMatchObject({
      value: 3,
      maxValue: 5,
      isReadOnly: true,
      size: "lg",
      testID: "found",
    });
  });

  it.each(["Item"] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Rating[name]).toBe(HeroRating[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useRating).toBe(heroUseRating);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<RatingProps>().toExtend<RatingContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<Rating accessibilityLabel="x" />);
    // @ts-expect-error `label` is required: a radio group with no name cannot be understood
    void (<Rating />);
  });
});
