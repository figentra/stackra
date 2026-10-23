/**
 * Stackra file contract:
 * Purpose: proves the web SkeletonGroup draws HeroUI's single shimmer only while it loads and shimmers, names the
 *          loading region through one status element that exists from the first render and empties when loading
 *          ends, leaves its bones silent, passes unknown props and the ref through, and refuses `variant`.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-042 sta-350:P-033 sta-350:P-034
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import type { SkeletonGroupContractProps } from "#contracts/types/skeleton-group-contract-props.type";
import { Skeleton } from "#react/skeleton/skeleton";
import { SkeletonGroup, type SkeletonGroupProps } from "#react/skeleton-group/skeleton-group";

/** The three classes of the single sweep. */
const SWEEP = ["skeleton--shimmer", "relative", "overflow-hidden"];

describe("SkeletonGroup (web)", () => {
  it("draws one sweep while it loads and shimmers, keeping the caller's class", () => {
    const { container } = render(
      <SkeletonGroup className="grid" data-testid="group">
        <Skeleton />
      </SkeletonGroup>,
    );
    const root = container.firstElementChild;
    for (const name of [...SWEEP, "grid"]) expect(root?.classList.contains(name), name).toBe(true);
  });

  it.each([
    ["pulse", {}],
    ["none", {}],
    ["shimmer", { isLoading: false }],
  ] as const)("draws no sweep for %s %j", (animationType, props) => {
    const { container } = render(<SkeletonGroup animationType={animationType} {...props} />);
    for (const name of SWEEP)
      expect(container.firstElementChild?.classList.contains(name)).toBe(false);
  });

  it("names the region through one status that stays and empties once loaded", () => {
    const { rerender } = render(<SkeletonGroup loadingLabel="Loading orders" />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Loading orders");
    rerender(<SkeletonGroup loadingLabel="Loading orders" isLoading={false} />);
    expect(screen.getByRole("status")).toBe(status);
    expect(status.textContent).toBe("");
  });

  it("has no status without a label, and its bones are silent", () => {
    const { container } = render(
      <SkeletonGroup>
        <Skeleton />
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <SkeletonGroup ref={ref} id="g" data-testid="group" aria-labelledby="t" />,
    );
    const root = container.firstElementChild;
    expect(root?.id).toBe("g");
    expect(root?.getAttribute("data-testid")).toBe("group");
    expect(root?.getAttribute("aria-labelledby")).toBe("t");
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses `variant`", () => {
    expectTypeOf<SkeletonGroupProps>().toExtend<SkeletonGroupContractProps>();
    // @ts-expect-error the animation is `animationType`
    render(<SkeletonGroup variant="pulse" />);
  });
});
