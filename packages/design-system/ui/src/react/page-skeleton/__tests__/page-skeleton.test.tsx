/**
 * Stackra file contract:
 * Purpose: proves the web PageSkeleton draws the bones of each layout in one group (one sweep, one spoken name that is
 *          filled after mount), defaults to the page layout, draws the rows of `PAGE_SKELETON_ROWS` and no more, shows
 *          no text and no role but the one status, takes its animation from the contract, passes unknown props and the
 *          ref through, and that the type requires `loadingLabel` and refuses `children` and `isLoading`.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 4.1.3; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-149
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { PageSkeletonLayout } from "#contracts/enums/page-skeleton-layout.enum";
import type { PageSkeletonContractProps } from "#contracts/types/page-skeleton-contract-props.type";
import { PAGE_SKELETON_ROWS } from "#core/constants/page-skeleton-rows.constant";
import { PageSkeleton } from "#react/page-skeleton/page-skeleton";
import type { PageSkeletonProps } from "#react/page-skeleton/page-skeleton.props";

/** The bones a skeleton drew. */
const bonesOf = (container: HTMLElement) => [...container.querySelectorAll(".skeleton")];

describe("PageSkeleton (web)", () => {
  it.each(PageSkeletonLayout)("draws every bone of the %s layout, in its rows", (layout) => {
    const { container } = render(<PageSkeleton layout={layout} loadingLabel="Loading" />);
    const rows = PAGE_SKELETON_ROWS[layout];
    expect(container.firstElementChild?.getAttribute("data-layout")).toBe(layout);
    expect(bonesOf(container)).toHaveLength(rows.reduce((sum, row) => sum + row.bones.length, 0));
    const drawnRows = [...container.querySelectorAll(".skeleton")].map(
      (bone) => bone.parentElement,
    );
    expect(new Set(drawnRows).size).toBe(rows.length);
  });

  it("is a page layout without a layout", () => {
    const { container } = render(<PageSkeleton loadingLabel="Loading" />);
    expect(container.firstElementChild?.getAttribute("data-layout")).toBe("page");
  });

  it("gives each bone the classes of its row, and each row its own", () => {
    const { container } = render(<PageSkeleton layout="page" loadingLabel="Loading" />);
    const [title] = bonesOf(container);
    for (const name of ["h-8", "w-1/3", "rounded"])
      expect(title?.classList.contains(name)).toBe(true);
    expect(title?.parentElement?.classList.contains("justify-between")).toBe(true);
  });

  it("names the loading region once, through one status that is filled after mount", () => {
    render(<PageSkeleton layout="table" loadingLabel="Loading orders" />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toBe("Loading orders");
  });

  it("draws one sweep over the group, the bones standing still", () => {
    const { container } = render(<PageSkeleton loadingLabel="Loading" />);
    expect(container.firstElementChild?.classList.contains("skeleton--shimmer")).toBe(true);
    expect(bonesOf(container)[0]?.classList.contains("skeleton--none")).toBe(true);
  });

  it("takes another animation from the contract", () => {
    const { container } = render(<PageSkeleton loadingLabel="Loading" animationType="pulse" />);
    expect(container.firstElementChild?.classList.contains("skeleton--shimmer")).toBe(false);
    expect(bonesOf(container)[0]?.classList.contains("skeleton--pulse")).toBe(true);
  });

  it("shows no text and no role beyond the status", () => {
    const { container } = render(<PageSkeleton layout="form" loadingLabel="Loading form" />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
    expect(container.textContent).toBe("Loading form");
  });

  it("passes unknown props and the ref through to the group, keeping the caller's class", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <PageSkeleton ref={ref} loadingLabel="Loading" id="p" className="extra" data-testid="page" />,
    );
    const root = container.firstElementChild;
    expect(root?.id).toBe("p");
    expect(root?.classList.contains("extra")).toBe(true);
    expect(root?.classList.contains("flex-col")).toBe(true);
    expect(root?.getAttribute("data-testid")).toBe("page");
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract, requires the label, refuses `children` and `isLoading`", () => {
    expectTypeOf<PageSkeletonProps>().toExtend<PageSkeletonContractProps>();
    // @ts-expect-error a page of placeholders is silent without its label
    void (<PageSkeleton />);
    // @ts-expect-error the layout draws the bones
    void (<PageSkeleton loadingLabel="Loading">content</PageSkeleton>);
    // @ts-expect-error a fallback is always loading
    void (<PageSkeleton loadingLabel="Loading" isLoading={false} />);
    // @ts-expect-error a layout is one of the four of the contract
    void (<PageSkeleton loadingLabel="Loading" layout="grid" />);
  });
});
