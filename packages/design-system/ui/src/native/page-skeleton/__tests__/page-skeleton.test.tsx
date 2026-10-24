/**
 * Stackra file contract:
 * Purpose: proves the native PageSkeleton draws the bones of each layout inside one SkeletonGroup, in the rows of
 *          `PAGE_SKELETON_ROWS` and no more, defaults to the page layout, hands the group its spoken name and the
 *          animation of the contract, passes unknown props through, and that the type requires `loadingLabel` and
 *          refuses `children` and `isLoading`.
 * Boundary: React Native does not render in vitest, so react-native, the skeleton and its group are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not their motion on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-150
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { PageSkeletonLayout } from "#contracts/enums/page-skeleton-layout.enum";
import type { PageSkeletonContractProps } from "#contracts/types/page-skeleton-contract-props.type";
import { PAGE_SKELETON_ROWS } from "#core/constants/page-skeleton-rows.constant";
import { PageSkeleton, type PageSkeletonProps } from "#native/page-skeleton/page-skeleton";

/** The props the group and every bone were handed, and every View, in render order. */
const received = vi.hoisted(() => ({
  group: {} as Record<string, unknown>,
  bones: [] as Record<string, unknown>[],
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/skeleton-group/skeleton-group", async () => {
  const { createElement } = await import("react");
  return {
    SkeletonGroup: (props: Record<string, unknown>) => {
      received.group = props;
      return createElement("div", { "data-testid": "group" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/skeleton/skeleton", async () => {
  const { createElement } = await import("react");
  return {
    Skeleton: (props: Record<string, unknown>) => {
      received.bones.push(props);
      return createElement("i", { "data-testid": "bone" });
    },
  };
});

describe("PageSkeleton (native)", () => {
  beforeEach(() => {
    received.group = {};
    received.bones = [];
    received.views = [];
  });

  it.each(PageSkeletonLayout)("draws every bone of the %s layout, in its rows", (layout) => {
    render(<PageSkeleton layout={layout} loadingLabel="Loading" />);
    const bones = PAGE_SKELETON_ROWS[layout].flatMap((row) => row.bones);
    expect(screen.getAllByTestId("bone")).toHaveLength(bones.length);
    expect(received.bones.map((bone) => bone["className"])).toEqual(
      bones.map((bone) => bone.className),
    );
    // One View for the column and one for each row.
    expect(received.views).toHaveLength(1 + PAGE_SKELETON_ROWS[layout].length);
  });

  it("is a page layout without a layout", () => {
    render(<PageSkeleton loadingLabel="Loading" />);
    expect(received.bones).toHaveLength(PAGE_SKELETON_ROWS.page.flatMap((row) => row.bones).length);
  });

  it("gives each row its own classes", () => {
    render(<PageSkeleton layout="page" loadingLabel="Loading" />);
    const header = received.views[1];
    expect(String(header?.["className"])).toContain("flex-row");
    expect(String(header?.["className"])).toContain("justify-between");
  });

  it("hands the group its spoken name and animation, and every bone silent", () => {
    render(<PageSkeleton loadingLabel="Loading orders" animationType="pulse" />);
    expect(received.group).toMatchObject({
      loadingLabel: "Loading orders",
      animationType: "pulse",
    });
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("passes unknown props through to the group", () => {
    render(<PageSkeleton loadingLabel="Loading" testID="page" className="extra" />);
    expect(received.group).toMatchObject({ testID: "page", className: "extra" });
  });

  it("types: extends the contract, requires the label, refuses `children` and `isLoading`", () => {
    expectTypeOf<PageSkeletonProps>().toExtend<PageSkeletonContractProps>();
    // @ts-expect-error a screen of placeholders is silent without its label
    void (<PageSkeleton />);
    // @ts-expect-error the layout draws the bones
    void (<PageSkeleton loadingLabel="Loading">content</PageSkeleton>);
    // @ts-expect-error a fallback is always loading
    void (<PageSkeleton loadingLabel="Loading" isLoading={false} />);
    // @ts-expect-error a layout is one of the four of the contract
    void (<PageSkeleton loadingLabel="Loading" layout="grid" />);
  });
});
