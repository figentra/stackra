/**
 * Stackra file contract:
 * Purpose: proves the native SkeletonGroup maps `animationType` to `variant` and forwards `isLoading` only when set,
 *          names a loading region with one busy progressbar element first in the group and nothing once loaded or
 *          without a label, tells its Skeletons they are in a group, passes HeroUI's own props through, and refuses
 *          `variant`.
 * Boundary: React Native does not render in vitest, so heroui-native and react-native are replaced by recording
 *          stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-043 sta-350:P-033 sta-350:P-034
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { SkeletonGroupContractProps } from "#contracts/types/skeleton-group-contract-props.type";
import { Skeleton } from "#native/skeleton/skeleton";
import { SkeletonGroup } from "#native/skeleton-group/skeleton-group";
import type { SkeletonGroupProps } from "#native/skeleton-group/skeleton-group.props";

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

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props["view"] = props;
      return createElement("div", { "data-testid": "view" });
    },
    StyleSheet: { absoluteFill: { position: "absolute" } },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("SkeletonGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands `animationType` over as `variant` and `isLoading` as is, each only when set", () => {
    render(<SkeletonGroup />);
    expect(propsOf("group")).not.toHaveProperty("variant");
    expect(propsOf("group")).not.toHaveProperty("isLoading");
    render(<SkeletonGroup animationType="pulse" isLoading={false} />);
    expect(propsOf("group")).toMatchObject({ variant: "pulse", isLoading: false });
  });

  it("names a loading region with one busy progressbar element, first in the group", () => {
    const { getByTestId } = render(
      <SkeletonGroup loadingLabel="Loading orders">
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(getByTestId("group").firstElementChild).toBe(getByTestId("view"));
    expect(propsOf("view")).toMatchObject({
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: "Loading orders",
      accessibilityState: { busy: true },
      accessibilityLiveRegion: "polite",
      pointerEvents: "none",
      style: { position: "absolute" },
    });
  });

  it("has no progressbar once loaded or without a label", () => {
    const { queryByTestId, rerender } = render(
      <SkeletonGroup loadingLabel="Loading orders" isLoading={false} />,
    );
    expect(queryByTestId("view")).toBeNull();
    rerender(<SkeletonGroup />);
    expect(queryByTestId("view")).toBeNull();
  });

  it("tells the Skeletons inside that they are in a group", () => {
    const { queryByTestId } = render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(queryByTestId("item")).toBeTruthy();
    expect(queryByTestId("skeleton")).toBeNull();
  });

  it("passes HeroUI Native's own props through", () => {
    render(
      <SkeletonGroup
        isSkeletonOnly
        className="gap-2"
        style={{ opacity: 0.5 }}
        animation="disable-all"
      />,
    );
    expect(propsOf("group")).toMatchObject({
      isSkeletonOnly: true,
      className: "gap-2",
      style: { opacity: 0.5 },
      animation: "disable-all",
    });
  });

  it("types: extends the contract and refuses `variant`", () => {
    expectTypeOf<SkeletonGroupProps>().toExtend<SkeletonGroupContractProps>();
    // @ts-expect-error the animation is `animationType`
    render(<SkeletonGroup variant="pulse" />);
  });
});
