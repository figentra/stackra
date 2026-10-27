/**
 * Stackra file contract:
 * Purpose: proves the web ProgressCircle draws HeroUI's ring at the three sizes and in every tone, is a named
 *          progressbar with a value (clamped to its range, in the percentage or the caller's text) or without one
 *          (indeterminate, no value attributes), draws a track and a fill circle and no text, and passes every other
 *          prop and the ref through.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes, attributes and SVG attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-118
import { Enum, Tone } from "@stackra/contracts";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";
import { ProgressCircle } from "#react/progress-circle/progress-circle";
import type { ProgressCircleProps } from "#react/progress-circle/progress-circle.props";

/** The circumference of HeroUI's ring: radius 16 in a 36-unit box. */
const CIRCUMFERENCE = 2 * Math.PI * 16;

const fillOf = (container: HTMLElement) =>
  container.querySelector<SVGCircleElement>(".progress-circle__fill-circle");

describe("ProgressCircle (web)", () => {
  it("is a medium accent ring with only a label, and indeterminate", () => {
    render(<ProgressCircle label="Syncing" />);
    const ring = screen.getByRole("progressbar", { name: "Syncing" });
    expect(ring.classList.contains("progress-circle--md")).toBe(true);
    expect(ring.classList.contains("progress-circle--accent")).toBe(true);
    for (const name of ["aria-valuenow", "aria-valuetext"])
      expect(ring.hasAttribute(name), name).toBe(false);
  });

  it.each(Size)("draws size %s", (size) => {
    render(<ProgressCircle label="Syncing" size={size} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-circle--${size}`)).toBe(
      true,
    );
  });

  it.each(Enum.values(Tone))("draws tone %s", (tone) => {
    render(<ProgressCircle label="Syncing" tone={tone} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-circle--${tone}`)).toBe(
      true,
    );
  });

  it("draws a track circle and a fill circle and no text", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={25} />);
    expect(container.querySelector(".progress-circle__track-circle")).not.toBeNull();
    expect(fillOf(container)).not.toBeNull();
    expect(container.textContent).toBe("");
  });

  it("is determinate with a value: its number, its percentage text and an arc of that length", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={25} />);
    const ring = screen.getByRole("progressbar");
    expect(ring.getAttribute("aria-valuenow")).toBe("25");
    expect(ring.getAttribute("aria-valuetext")).toBe("25%");
    expect(Number(fillOf(container)?.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      CIRCUMFERENCE * 0.75,
      3,
    );
  });

  it("holds a value to the range and speaks the caller's text", () => {
    const { container } = render(
      <ProgressCircle label="Syncing" value={99} maxValue={12} valueLabel="12 of 12" />,
    );
    const ring = screen.getByRole("progressbar");
    expect(ring.getAttribute("aria-valuenow")).toBe("12");
    expect(ring.getAttribute("aria-valuetext")).toBe("12 of 12");
    expect(Number(fillOf(container)?.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 3);
  });

  it("is named by aria-label", () => {
    render(<ProgressCircle label="Syncing" value={25} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("Syncing");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressCircle
        ref={ref}
        label="Syncing"
        id="c"
        data-testid="ring"
        aria-describedby="d"
        className="m-2"
      />,
    );
    const ring = screen.getByRole("progressbar");
    expect(ring.id).toBe("c");
    expect(ring.getAttribute("data-testid")).toBe("ring");
    expect(ring.getAttribute("aria-describedby")).toBe("d");
    expect(ring.classList.contains("m-2")).toBe(true);
    expect(ref.current).toBe(ring);
  });

  it("types: extends the contract, needs a label and refuses `color`, `isIndeterminate` and the name props", () => {
    expectTypeOf<ProgressCircleProps>().toExtend<ProgressCircleContractProps>();
    // @ts-expect-error a progress circle must be named
    render(<ProgressCircle />);
    // @ts-expect-error the colour role is `tone`
    render(<ProgressCircle label="x" color="danger" />);
    // @ts-expect-error a missing `value` is what makes it indeterminate
    render(<ProgressCircle label="x" isIndeterminate />);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<ProgressCircleProps>().not.toHaveProperty("aria-label");
  });
});
