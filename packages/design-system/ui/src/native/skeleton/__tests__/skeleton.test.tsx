/**
 * Stackra file contract:
 * Purpose: proves the native Skeleton renders HeroUI Native's Skeleton alone and its group item inside a group, maps
 *          `animationType` to `variant`, forwards `isLoading` and the animation only when the caller set them (so a
 *          group's values are not erased), passes children and HeroUI's own props through, and refuses `variant` and
 *          `onLayout`.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering or motion on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-043 sta-350:P-033 sta-350:P-034
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { SkeletonAnimation } from "#contracts/enums/skeleton-animation.enum";
import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";
import { Skeleton } from "#native/skeleton/skeleton";
import type { SkeletonProps } from "#native/skeleton/skeleton.props";
import { SkeletonGroupContext } from "#native/skeleton-group/skeleton-group-context";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Skeleton: record("skeleton"),
    SkeletonGroup: Object.assign(record("group"), { Item: record("item") }),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("Skeleton (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("renders HeroUI Native's Skeleton alone and its group item inside a group", () => {
    const { queryByTestId, rerender } = render(<Skeleton />);
    expect(queryByTestId("skeleton")).toBeTruthy();
    expect(queryByTestId("item")).toBeNull();
    rerender(
      <SkeletonGroupContext value>
        <Skeleton />
      </SkeletonGroupContext>,
    );
    expect(queryByTestId("item")).toBeTruthy();
    expect(queryByTestId("skeleton")).toBeNull();
  });

  it.each(SkeletonAnimation)("hands %s over as `variant`", (animationType) => {
    render(<Skeleton animationType={animationType} />);
    expect(propsOf("skeleton")).toMatchObject({ variant: animationType });
    expect(propsOf("skeleton")).not.toHaveProperty("animationType");
  });

  it("forwards only the keys the caller set, so the group's values hold", () => {
    render(
      <SkeletonGroupContext value>
        <Skeleton />
      </SkeletonGroupContext>,
    );
    expect(propsOf("item")).not.toHaveProperty("variant");
    expect(propsOf("item")).not.toHaveProperty("isLoading");
    render(
      <SkeletonGroupContext value>
        <Skeleton isLoading={false} animationType="pulse" />
      </SkeletonGroupContext>,
    );
    expect(propsOf("item")).toMatchObject({ isLoading: false, variant: "pulse" });
  });

  it("passes children and HeroUI Native's own props through", () => {
    // A cast: the test needs only an identity to follow, not a real layout animation.
    const entering = (() => undefined) as never;
    const { getByText } = render(
      <Skeleton
        animation={{ shimmer: { duration: 2000, highlightColor: "#fff" } }}
        isAnimatedStyleActive={false}
        className="h-4 w-3/4"
        testID="bone"
        entering={entering}
        accessibilityHint="hint"
      >
        <b>Name</b>
      </Skeleton>,
    );
    expect(getByText("Name")).toBeTruthy();
    expect(propsOf("skeleton")).toMatchObject({
      animation: { shimmer: { duration: 2000, highlightColor: "#fff" } },
      isAnimatedStyleActive: false,
      className: "h-4 w-3/4",
      testID: "bone",
      entering,
      accessibilityHint: "hint",
    });
  });

  it("types: extends the contract and refuses `variant` and `onLayout`", () => {
    expectTypeOf<SkeletonProps>().toExtend<SkeletonContractProps>();
    // @ts-expect-error the animation is `animationType`
    render(<Skeleton variant="pulse" />);
    // @ts-expect-error HeroUI's own handler measures the shimmer
    render(<Skeleton onLayout={() => undefined} />);
  });
});
