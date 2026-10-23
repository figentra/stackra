/**
 * Stackra file contract:
 * Purpose: proves the web Skeleton draws one HeroUI bone per animation while loading and its children, with no bone
 *          and no wrapper, once loaded; takes the loading state and animation of its SkeletonGroup unless it sets its
 *          own; passes unknown props and the ref through; and refuses `variant` and an unknown animation.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-042 sta-350:P-033 sta-350:P-034
import { render } from "@testing-library/react";
import { createRef } from "react";

import { SkeletonAnimation } from "#contracts/enums/skeleton-animation.enum";
import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";
import { Skeleton, type SkeletonProps } from "#react/skeleton/skeleton";
import { SkeletonGroup } from "#react/skeleton-group/skeleton-group";

const bonesOf = (container: HTMLElement) => [...container.querySelectorAll(".skeleton")];

describe("Skeleton (web)", () => {
  it("is one shimmering bone by default", () => {
    const { container } = render(<Skeleton />);
    const bones = bonesOf(container);
    expect(bones).toHaveLength(1);
    expect(bones[0]?.tagName).toBe("DIV");
    expect(bones[0]?.classList.contains("skeleton--shimmer")).toBe(true);
  });

  it.each(SkeletonAnimation)("draws the %s animation", (animationType) => {
    const { container } = render(<Skeleton animationType={animationType} />);
    expect(bonesOf(container)[0]?.classList.contains(`skeleton--${animationType}`)).toBe(true);
  });

  it("shows no children while loading, and only the children, unwrapped, once loaded", () => {
    const { container, rerender } = render(
      <Skeleton>
        <b>Name</b>
      </Skeleton>,
    );
    expect(container.textContent).toBe("");
    rerender(
      <Skeleton isLoading={false}>
        <b>Name</b>
      </Skeleton>,
    );
    expect(bonesOf(container)).toHaveLength(0);
    expect(container.firstElementChild?.tagName).toBe("B");
  });

  it("takes the group's state, and its own beats the group's", () => {
    const { container, rerender } = render(
      <SkeletonGroup isLoading={false}>
        <Skeleton>
          <b>Name</b>
        </Skeleton>
      </SkeletonGroup>,
    );
    expect(bonesOf(container)).toHaveLength(0);
    expect(container.querySelector("b")).toBeTruthy();
    rerender(
      <SkeletonGroup isLoading={false}>
        <Skeleton isLoading />
      </SkeletonGroup>,
    );
    expect(bonesOf(container)).toHaveLength(1);
    rerender(
      <SkeletonGroup>
        <Skeleton isLoading={false}>
          <b>Name</b>
        </Skeleton>
      </SkeletonGroup>,
    );
    expect(bonesOf(container)).toHaveLength(0);
  });

  it("stands still in a shimmering group, and follows a pulsing one unless it picks its own", () => {
    const { container, rerender } = render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(bonesOf(container)[0]?.classList.contains("skeleton--none")).toBe(true);
    rerender(
      <SkeletonGroup animationType="pulse">
        <Skeleton />
      </SkeletonGroup>,
    );
    expect(bonesOf(container)[0]?.classList.contains("skeleton--pulse")).toBe(true);
    rerender(
      <SkeletonGroup animationType="shimmer">
        <Skeleton animationType="pulse" />
      </SkeletonGroup>,
    );
    expect(bonesOf(container)[0]?.classList.contains("skeleton--pulse")).toBe(true);
  });

  it("passes unknown props and the ref through to the bone", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Skeleton
        ref={ref}
        id="s"
        className="h-4 w-3/4"
        style={{ opacity: 0.5 }}
        data-testid="bone"
        aria-describedby="d"
      />,
    );
    const bone = bonesOf(container)[0] as HTMLElement;
    expect(bone.id).toBe("s");
    expect(bone.classList.contains("h-4")).toBe(true);
    expect(bone.style.opacity).toBe("0.5");
    expect(bone.getAttribute("data-testid")).toBe("bone");
    expect(bone.getAttribute("aria-describedby")).toBe("d");
    expect(ref.current).toBe(bone);
  });

  it("types: extends the contract and refuses `variant` and an unknown animation", () => {
    expectTypeOf<SkeletonProps>().toExtend<SkeletonContractProps>();
    // @ts-expect-error the animation is `animationType`
    render(<Skeleton variant="pulse" />);
    // @ts-expect-error there is no wave animation
    render(<Skeleton animationType="wave" />);
  });
});
